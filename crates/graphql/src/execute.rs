//! # Execute
//!
//! This module contains the Axum and GraphQL executors.

/// Execute an Axum app with a Lambda event.
pub async fn execute_axum(
    app: axum::Router,
    event: lambda_http::Request,
) -> Result<axum::http::Response<axum::body::Body>, lambda_http::Error> {
    let (lambda_parts, lambda_body) = event.into_parts();

    use lambda_http::tower::ServiceExt;
    let axum_response = app
        .oneshot(axum::http::Request::from_parts(lambda_parts, lambda_body))
        .await?;

    Ok(axum_response)
}
