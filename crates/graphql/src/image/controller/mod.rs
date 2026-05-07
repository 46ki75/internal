pub mod request;
pub mod response;
pub mod router;

use self::response::*;
use axum::{extract::State, response::IntoResponse};
use std::sync::Arc;

#[utoipa::path(
    get,
    path = "/api/v1/image",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Images", body = FetchImagesResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn fetch_images(
    State(state): State<Arc<crate::image::controller::router::ImageState>>,
) -> impl IntoResponse {
    let image_use_case = state.image_use_case.clone();

    match image_use_case.fetch_images().await {
        Ok(output) => axum::Json(FetchImagesResponse::from(output)).into_response(),
        Err(e) => {
            tracing::error!("Error fetching images: {:?}", e);
            axum::response::Response::builder()
                .status(500)
                .body(axum::body::Body::from("Internal Server Error".to_owned()))
                .unwrap()
                .into_response()
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/image/tag",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Image tags", body = Vec<ImageTagResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn fetch_image_tags(
    State(state): State<Arc<crate::image::controller::router::ImageState>>,
) -> impl IntoResponse {
    let image_use_case = state.image_use_case.clone();

    match image_use_case.fetch_image_tags().await {
        Ok(output) => axum::Json(
            output
                .into_iter()
                .map(ImageTagResponse::from)
                .collect::<Vec<_>>(),
        )
        .into_response(),
        Err(e) => {
            tracing::error!("Error fetching image tags: {:?}", e);
            axum::response::Response::builder()
                .status(500)
                .body(axum::body::Body::from("Internal Server Error".to_owned()))
                .unwrap()
                .into_response()
        }
    }
}
