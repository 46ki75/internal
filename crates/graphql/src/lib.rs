#![allow(clippy::too_many_arguments)]

pub mod anki;
pub mod bookmark;
pub mod cache;
pub mod dto;
pub mod entity;
pub mod error;
pub mod execute;
pub mod graphql_handler;
pub mod layer;
pub mod mutation;
pub mod query;
pub mod repository;
pub mod resolver;
pub mod router;
pub mod schema;
pub mod service;
pub mod to_do;
pub mod tts;

/// Handler function of AWS Lambda.
pub async fn function_handler(
    event: http::Request<lambda_http::Body>,
) -> Result<http::Response<axum::body::Body>, lambda_http::Error> {
    tracing::debug!("HTTP Request: {} {}", event.method(), event.uri().path());

    let app = crate::router::init_router().await?;

    let response = crate::execute::execute_axum(app.clone(), event).await?;

    Ok(response)
}
