#![deny(clippy::unwrap_used)]

use aws_config::BehaviorVersion;
use aws_sdk_cloudwatch::{
    Client,
    types::{Dimension, MetricDatum, StandardUnit},
};

#[tokio::test]
#[ignore = "live: publishes a custom metric to the configured AWS account"]
async fn publishes_metric_to_cloudwatch() -> Result<(), Box<dyn std::error::Error>> {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = Client::new(&config);
    let datum = MetricDatum::builder()
        .metric_name("usage")
        .dimensions(
            Dimension::builder()
                .name("Provider")
                .value("jcode-cloudwatch-live-test")
                .build(),
        )
        .dimensions(
            Dimension::builder()
                .name("Limit")
                .value("live test")
                .build(),
        )
        .value(0.0)
        .unit(StandardUnit::Percent)
        .build();

    client
        .put_metric_data()
        .namespace("LLM/JCodeCloudWatchLiveTest")
        .metric_data(datum)
        .send()
        .await?;

    Ok(())
}
