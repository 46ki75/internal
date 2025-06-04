//! # Execute
//!
//! This module contains the Axum and GraphQL executors.

use tower::ServiceExt;

/// Execute an Axum app with a Lambda event.
pub async fn execute_axum(
    app: axum::Router,
    event: lambda_http::Request,
) -> Result<lambda_http::Response<lambda_http::Body>, lambda_http::Error> {
    let (lambda_parts, lambda_body) = event.into_parts();

    let axum_response = app
        .oneshot(axum::http::Request::from_parts(lambda_parts, lambda_body))
        .await?;

    let (axum_parts, axum_body) = axum_response.into_parts();

    let body_bytes = axum::body::to_bytes(axum_body, usize::MAX).await?;
    let lambda_body = lambda_http::Body::Binary(body_bytes.to_vec());

    let lambda_response = lambda_http::Response::from_parts(axum_parts, lambda_body);

    Ok(lambda_response)
}
