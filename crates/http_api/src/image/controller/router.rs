use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct ImageState {
    pub image_use_case: Arc<crate::image::use_case::ImageUseCase>,
}

pub async fn init_image_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let use_case = Arc::new(crate::image::use_case::ImageUseCase {
        repository: Arc::new(crate::image::repository::ImageRepositoryImpl {}),
    });
    let state = Arc::new(ImageState {
        image_use_case: use_case,
    });

    let (router, api) = OpenApiRouter::new()
        .routes(routes!(crate::image::controller::fetch_images))
        .routes(routes!(crate::image::controller::fetch_image_tags))
        .with_state(state)
        .split_for_parts();

    Ok((router, api))
}
