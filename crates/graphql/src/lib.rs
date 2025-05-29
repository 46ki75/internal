pub mod config;
pub mod entity;
pub mod error;
pub mod execute;
pub mod graphql_handler;
pub mod mutation;
pub mod query;
pub mod record;
pub mod repository;
pub mod resolver;
pub mod router;
pub mod schema;
pub mod service;
pub mod util;

/// Handler function of AWS Lambda.
pub async fn function_handler(
    event: lambda_http::Request,
) -> Result<lambda_http::Response<lambda_http::Body>, lambda_http::Error> {
    tracing::debug!("HTTP Request: {} {}", event.method(), event.uri().path());

    let app = crate::router::init_router().await?;

    let response = crate::execute::execute_axum(app.clone(), event).await?;

    Ok(response)
}
