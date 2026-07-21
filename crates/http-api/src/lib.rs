#![allow(clippy::too_many_arguments)]

// Shared infrastructure now lives in the `http-api-core` crate. Re-export it
// under the original module paths so `crate::{cache,error,layer}` (and the
// `http_api::…` paths used by tests) keep resolving while features stay here.
pub use http_api_core::{cache, error, layer};

// Feature crates re-exported under their original module names so `crate::<feat>`
// (and `http_api::<feat>::…` in tests) keep resolving as features move out.
pub use http_api_anki as anki;
pub use http_api_bookmark as bookmark;
pub use http_api_icon as icon;
pub use http_api_image as image;
pub use http_api_to_do as to_do;
pub use http_api_trivia as trivia;
pub use http_api_typing as typing;
pub use http_api_writing_assessment as writing_assessment;

pub mod execute;
pub mod router;

/// Handler function of AWS Lambda.
pub async fn function_handler(
    event: http::Request<lambda_http::Body>,
) -> Result<http::Response<axum::body::Body>, lambda_http::Error> {
    tracing::debug!("HTTP Request: {} {}", event.method(), event.uri().path());

    let app = crate::router::init_router().await?;

    let response = crate::execute::execute_axum(app.clone(), event).await?;

    Ok(response)
}
