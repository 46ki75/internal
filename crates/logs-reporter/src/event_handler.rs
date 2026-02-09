use aws_config::BehaviorVersion;
use aws_lambda_events::event::cloudwatch_logs::LogsEvent;
use lambda_runtime::{tracing, Error, LambdaEvent};

#[derive(Debug)]
enum Level {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}

pub(crate) async fn function_handler(event: LambdaEvent<LogsEvent>) -> Result<(), Error> {
    let sns_info_topic_arn = std::env::var("SNS_INFO_TOPIC_ARN")?;
    let sns_warn_topic_arn = std::env::var("SNS_WARN_TOPIC_ARN")?;
    let sns_error_topic_arn = std::env::var("SNS_ERROR_TOPIC_ARN")?;

    let subscription_filters = &event.payload.aws_logs.data.subscription_filters;

    let level = if subscription_filters.iter().any(|f| f.contains("_debug")) {
        Level::DEBUG
    } else if subscription_filters.iter().any(|f| f.contains("_info")) {
        Level::INFO
    } else if subscription_filters.iter().any(|f| f.contains("_warn")) {
        Level::WARN
    } else if subscription_filters.iter().any(|f| f.contains("_error")) {
        Level::ERROR
    } else {
        Level::INFO
    };

    let topic_arn = match level {
        Level::DEBUG | Level::INFO => sns_info_topic_arn,
        Level::WARN => sns_warn_topic_arn,
        Level::ERROR => sns_error_topic_arn,
    };

    let message = format!(
        "An {:?} level message was captured by the subscription filter.",
        level
    );

    let logs = event
        .payload
        .aws_logs
        .data
        .log_events
        .into_iter()
        .map(|log_event| {
            format!(
                "| Timestamp: {} | -------------------------------------------------- |\n{}",
                log_event.timestamp, log_event.message,
            )
        })
        .collect::<Vec<String>>();

    let full_message = format!("{}\nLogs:\n{}", message, logs.join("\n"));

    let sdk_config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = aws_sdk_sns::Client::new(&sdk_config);

    let response: aws_sdk_sns::operation::publish::PublishOutput = client
        .publish()
        .topic_arn(topic_arn)
        .message(full_message)
        .send()
        .await?;

    Ok(())
}
