//! Export the composed API document without AWS credentials or a running server.
use http_body_util::BodyExt;
use tower::ServiceExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let response = http_api::router::init_router()
        .await?
        .clone()
        .oneshot(
            http::Request::get("/api-gateway/api/v1/openapi.json")
                .body(axum::body::Body::empty())?,
        )
        .await?;
    let bytes = response.into_body().collect().await?.to_bytes();
    let document: serde_json::Value = serde_json::from_slice(&bytes)?;
    println!("{}", serde_json::to_string_pretty(&document)?);
    Ok(())
}
