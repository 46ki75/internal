//! # Execute
//!
//! This module contains the Axum and GraphQL executors.

use tower::ServiceExt;

/// Execute an Axum app with a Lambda event.
pub async fn execute_axum(
    app: axum::Router,
    event: lambda_http::Request,
) -> Result<lambda_http::Response<lambda_http::Body>, lambda_http::Error> {
    let (parts, body) = event.into_parts();

    let axum_response = app
        .oneshot(axum::http::Request::from_parts(parts, body))
        .await?;

    let status = axum_response.status();
    let headers = axum_response.headers().clone();
    let body = axum_response.into_body();
    let body_bytes = axum::body::to_bytes(body, usize::MAX).await?;

    let mut lambda_response = lambda_http::Response::builder().status(status);

    for (key, value) in headers {
        if let Some(key) = key {
            lambda_response = lambda_response.header(key.as_str(), value.to_str().unwrap());
        }
    }

    Ok(lambda_response
        .body(lambda_http::Body::Binary(body_bytes.to_vec()))
        .map_err(Box::new)?)
}
