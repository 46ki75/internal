#![deny(clippy::unwrap_used)]

use std::{process::Command, process::ExitCode};

use aws_config::BehaviorVersion;
use aws_sdk_cloudwatch::{
    Client,
    types::{Dimension, MetricDatum, StandardUnit},
};
use serde::Deserialize;
use thiserror::Error;
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

const CLOUDWATCH_NAMESPACE: &str = "LLM";
const METRIC_NAME: &str = "usage";
const ERROR_METRIC_NAME: &str = "error";
const MAX_METRICS_PER_REQUEST: usize = 1_000;

#[derive(Debug, Deserialize)]
struct UsageReport {
    providers: Vec<Provider>,
}

#[derive(Debug, Deserialize)]
struct Provider {
    provider_name: String,
    limits: Vec<Limit>,
    #[serde(default)]
    error: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct Limit {
    name: String,
    usage_percent: f64,
}

#[derive(Debug)]
struct Metrics {
    data: Vec<MetricDatum>,
    provider_error_indexes: Vec<usize>,
}

#[derive(Debug, Error)]
enum AppError {
    #[error("failed to start `jcode usage --json`: {0}")]
    StartJcode(#[source] std::io::Error),
    #[error("`jcode usage --json` exited with {status}: {stderr}")]
    JcodeFailed {
        status: std::process::ExitStatus,
        stderr: String,
    },
    #[error("`jcode usage --json` returned invalid JSON: {0}")]
    ParseUsage(#[source] serde_json::Error),
    #[error("CloudWatch rejected metric batch {batch}: {source}")]
    PublishMetrics {
        batch: usize,
        #[source]
        source: Box<dyn std::error::Error + Send + Sync>,
    },
}

#[tokio::main]
async fn main() -> ExitCode {
    init_logging();

    match run().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            error!(error = %error, "command failed");
            ExitCode::FAILURE
        }
    }
}

fn init_logging() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_writer(std::io::stderr)
        .init();
}

async fn run() -> Result<(), AppError> {
    let report = read_usage_report()?;
    let metrics = build_metrics(report);

    for index in metrics.provider_error_indexes {
        warn!(
            provider_index = index,
            "provider report contains an error; publishing any available limits"
        );
    }

    if metrics.data.is_empty() {
        info!("no eligible metrics to publish");
        return Ok(());
    }

    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = Client::new(&config);
    publish_metrics(&client, &metrics.data).await?;

    info!(metric_count = metrics.data.len(), "published metric data");
    Ok(())
}

fn read_usage_report() -> Result<UsageReport, AppError> {
    let output = Command::new("jcode")
        .args(["usage", "--json"])
        .output()
        .map_err(AppError::StartJcode)?;

    if !output.status.success() {
        return Err(AppError::JcodeFailed {
            status: output.status,
            stderr: String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        });
    }

    parse_usage_report(&output.stdout).map_err(AppError::ParseUsage)
}

fn parse_usage_report(json: &[u8]) -> Result<UsageReport, serde_json::Error> {
    serde_json::from_slice(json)
}

fn build_metrics(report: UsageReport) -> Metrics {
    let mut data = Vec::new();
    let mut provider_error_indexes = Vec::new();

    for (index, provider) in report.providers.into_iter().enumerate() {
        let provider_name = normalize_provider_name(&provider.provider_name);
        if provider.error == Some(true) {
            provider_error_indexes.push(index);
            data.push(
                MetricDatum::builder()
                    .metric_name(ERROR_METRIC_NAME)
                    .dimensions(
                        Dimension::builder()
                            .name("Provider")
                            .value(&provider_name)
                            .build(),
                    )
                    .value(1.0)
                    .unit(StandardUnit::Count)
                    .build(),
            );
        }

        for limit in provider.limits {
            let provider_dimension = Dimension::builder()
                .name("Provider")
                .value(&provider_name)
                .build();
            let limit_dimension = Dimension::builder().name("Limit").value(limit.name).build();

            data.push(
                MetricDatum::builder()
                    .metric_name(METRIC_NAME)
                    .dimensions(provider_dimension)
                    .dimensions(limit_dimension)
                    .value(limit.usage_percent)
                    .unit(StandardUnit::Percent)
                    .build(),
            );
        }
    }

    Metrics {
        data,
        provider_error_indexes,
    }
}

fn normalize_provider_name(provider_name: &str) -> String {
    let mut normalized = String::with_capacity(provider_name.len());
    let mut cursor = 0;

    while let Some(relative_start) = provider_name[cursor..].find('(') {
        let start = cursor + relative_start;
        let Some(relative_end) = provider_name[start + 1..].find(')') else {
            break;
        };
        let end = start + 1 + relative_end;
        let contents = &provider_name[start + 1..end];

        normalized.push_str(&provider_name[cursor..start]);
        if !(contents.contains('*') && contents.contains('@')) {
            normalized.push_str(&provider_name[start..=end]);
        }
        cursor = end + 1;
    }

    normalized.push_str(&provider_name[cursor..]);
    normalized.trim_end().to_owned()
}

async fn publish_metrics(client: &Client, metrics: &[MetricDatum]) -> Result<(), AppError> {
    for (batch_index, batch) in metrics.chunks(MAX_METRICS_PER_REQUEST).enumerate() {
        client
            .put_metric_data()
            .namespace(CLOUDWATCH_NAMESPACE)
            .set_metric_data(Some(batch.to_vec()))
            .send()
            .await
            .map_err(|source| AppError::PublishMetrics {
                batch: batch_index + 1,
                source: Box::new(source),
            })?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_JSON: &[u8] = br#"
        {
          "providers": [
            {
              "provider_name": "OpenAI (ChatGPT) (4***5@gmail.com)",
              "limits": [
                { "name": "7-day window", "usage_percent": 66 },
                { "name": "GPT-5.3-Codex-Spark (7d)", "usage_percent": 25.5 }
              ],
              "error": null,
              "extra_info": { "ignored": true }
            },
            {
              "provider_name": "Anthropic (Claude) (m*@ikuma.cloud)",
              "limits": [
                { "name": "5-hour window", "usage_percent": 12 },
                { "name": "7-day window", "usage_percent": 34 }
              ]
            },
            {
              "provider_name": "GitHub Copilot",
              "limits": [
                { "name": "Premium requests", "usage_percent": 50 }
              ]
            }
          ]
        }
    "#;

    #[test]
    fn parses_sample_and_builds_expected_metrics() -> Result<(), Box<dyn std::error::Error>> {
        let report = parse_usage_report(SAMPLE_JSON)?;
        let metrics = build_metrics(report);

        assert_eq!(CLOUDWATCH_NAMESPACE, "LLM");
        assert_eq!(metrics.data.len(), 5);
        assert!(metrics.provider_error_indexes.is_empty());

        let expected = [
            ("OpenAI (ChatGPT)", "7-day window", 66.0),
            ("OpenAI (ChatGPT)", "GPT-5.3-Codex-Spark (7d)", 25.5),
            ("Anthropic (Claude)", "5-hour window", 12.0),
            ("Anthropic (Claude)", "7-day window", 34.0),
            ("GitHub Copilot", "Premium requests", 50.0),
        ];

        for (datum, (provider, limit, value)) in metrics.data.iter().zip(expected) {
            assert_eq!(datum.metric_name(), Some(METRIC_NAME));
            assert_eq!(datum.value(), Some(value));
            assert_eq!(datum.unit(), Some(&StandardUnit::Percent));
            assert_eq!(datum.dimensions().len(), 2);
            assert_dimension(datum, "Provider", provider);
            assert_dimension(datum, "Limit", limit);
        }

        Ok(())
    }

    #[test]
    fn includes_github_copilot_when_it_has_limits() -> Result<(), Box<dyn std::error::Error>> {
        let report = parse_usage_report(SAMPLE_JSON)?;
        let metrics = build_metrics(report);

        assert!(metrics.data.iter().any(|datum| {
            datum
                .dimensions()
                .iter()
                .any(|dimension| dimension.value() == Some("GitHub Copilot"))
        }));
        Ok(())
    }

    #[test]
    fn normalizes_only_redacted_email_segments() {
        assert_eq!(
            normalize_provider_name("OpenAI (ChatGPT) (4***5@gmail.com)"),
            "OpenAI (ChatGPT)"
        );
        assert_eq!(
            normalize_provider_name("Anthropic (Claude) (m*@ikuma.cloud)"),
            "Anthropic (Claude)"
        );
        assert_eq!(
            normalize_provider_name("Provider (Model)"),
            "Provider (Model)"
        );
        assert_eq!(normalize_provider_name("Provider"), "Provider");
        assert_eq!(
            normalize_provider_name("Provider (first*@example.com) (Model) (s***d@example.org)"),
            "Provider  (Model)"
        );
    }

    #[test]
    fn accepts_empty_limits() -> Result<(), Box<dyn std::error::Error>> {
        let report = parse_usage_report(
            br#"{
                "providers": [{
                    "provider_name": "Provider (u***r@example.com)",
                    "limits": []
                }]
            }"#,
        )?;
        let metrics = build_metrics(report);

        assert!(metrics.data.is_empty());
        assert!(metrics.provider_error_indexes.is_empty());
        Ok(())
    }

    #[test]
    fn records_provider_errors_and_keeps_available_limits() -> Result<(), Box<dyn std::error::Error>>
    {
        let report = parse_usage_report(
            br#"{
                "providers": [{
                    "provider_name": "Provider (u***r@example.com)",
                    "limits": [{"name": "daily", "usage_percent": 42}],
                    "error": true
                }]
            }"#,
        )?;
        let metrics = build_metrics(report);

        assert_eq!(metrics.data.len(), 2);
        assert_eq!(metrics.provider_error_indexes, [0]);
        let error = &metrics.data[0];
        assert_eq!(error.metric_name(), Some(ERROR_METRIC_NAME));
        assert_eq!(error.value(), Some(1.0));
        assert_eq!(error.unit(), Some(&StandardUnit::Count));
        assert_eq!(error.dimensions().len(), 1);
        assert_dimension(error, "Provider", "Provider");
        Ok(())
    }

    #[test]
    fn does_not_publish_error_metric_when_error_is_false() -> Result<(), Box<dyn std::error::Error>>
    {
        let report = parse_usage_report(
            br#"{
                "providers": [{
                    "provider_name": "Provider",
                    "limits": [],
                    "error": false
                }]
            }"#,
        )?;
        let metrics = build_metrics(report);

        assert!(metrics.data.is_empty());
        assert!(metrics.provider_error_indexes.is_empty());
        Ok(())
    }

    #[test]
    fn publishes_error_metric_without_limits() -> Result<(), Box<dyn std::error::Error>> {
        let report = parse_usage_report(
            br#"{
                "providers": [{
                    "provider_name": "Provider (a***t@example.com)",
                    "limits": [],
                    "error": true
                }]
            }"#,
        )?;
        let metrics = build_metrics(report);

        assert_eq!(metrics.data.len(), 1);
        assert_eq!(metrics.data[0].metric_name(), Some(ERROR_METRIC_NAME));
        assert_dimension(&metrics.data[0], "Provider", "Provider");
        Ok(())
    }

    #[test]
    fn rejects_missing_required_fields_and_malformed_json() {
        assert!(parse_usage_report(br#"{"providers":[{"provider_name":"Provider"}]}"#).is_err());
        assert!(
            parse_usage_report(
                br#"{"providers":[{"provider_name":"Provider","limits":[{"name":"daily"}]}]}"#
            )
            .is_err()
        );
        assert!(
            parse_usage_report(
                br#"{"providers":[{"provider_name":"Provider","limits":[{"name":"daily","usage_percent":"many"}]}]}"#
            )
            .is_err()
        );
        assert!(parse_usage_report(br#"{"providers": ["#).is_err());
    }

    fn assert_dimension(datum: &MetricDatum, name: &str, value: &str) {
        assert!(
            datum
                .dimensions()
                .iter()
                .any(|dimension| dimension.name() == Some(name) && dimension.value() == Some(value)),
            "missing dimension {name}={value}"
        );
    }
}
