use lambda_http::{run, service_fn, tracing, Error};

#[tokio::main]
async fn main() -> Result<(), Error> {
    env_logger::init();
    tracing::init_default_subscriber();
    run(service_fn(internal_graphql::function_handler)).await
}
