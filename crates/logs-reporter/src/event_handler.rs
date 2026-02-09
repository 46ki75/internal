use aws_config::BehaviorVersion;
use aws_lambda_events::event::cloudwatch_logs::LogsEvent;
use lambda_runtime::{tracing, Error, LambdaEvent};

pub(crate) async fn function_handler(event: LambdaEvent<LogsEvent>) -> Result<(), Error> {
    // Extract some useful information from the request
    let payload = event.payload.aws_logs.data;
    tracing::info!("Payload: {:?}", payload);

    let sdk_config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = aws_sdk_sns::Client::new(&sdk_config);
    Ok(())
}
