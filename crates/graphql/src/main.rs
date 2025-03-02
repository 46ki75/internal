use lambda_http::{run, service_fn, Error};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let rust_log_format = std::env::var("RUST_LOG_FORMAT").unwrap_or("pretty".to_string());

    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("warn"));

    let fmt = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_level(true)
        .with_file(true)
        .with_line_number(true);

    if rust_log_format == "json" {
        fmt.json().init();
    } else {
        fmt.pretty().init(); // cargo add tracing_subscriber --features=ansi
    }

    run(service_fn(internal_graphql::function_handler)).await
}
