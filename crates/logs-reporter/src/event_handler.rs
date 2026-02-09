use aws_lambda_events::event::cloudwatch_logs::LogsEvent;
use lambda_runtime::{tracing, Error, LambdaEvent};

pub(crate) async fn function_handler(event: LambdaEvent<LogsEvent>) -> Result<(), Error> {
    // Extract some useful information from the request
    let payload = event.payload;
    tracing::info!("Payload: {:?}", payload);

    Ok(())
}
