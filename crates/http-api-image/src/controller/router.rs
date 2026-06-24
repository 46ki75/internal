use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct ImageState {
    pub image_use_case: Arc<crate::use_case::ImageUseCase>,
}

pub async fn init_image_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), http_api_core::error::Error> {
    let use_case = Arc::new(crate::use_case::ImageUseCase {
        repository: Arc::new(crate::repository::ImageRepositoryImpl {}),
    });
    let state = Arc::new(ImageState {
        image_use_case: use_case,
    });

    Ok(image_router(state))
}

/// Builds the image router from injected state. Split out from
/// [`init_image_router`] so tests can drive it with a stub-backed use_case.
pub fn image_router(state: Arc<ImageState>) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(crate::controller::fetch_images))
        .routes(routes!(crate::controller::fetch_image_tags))
        .with_state(state)
        .split_for_parts()
}
