pub mod request;
pub mod response;
pub mod router;

use self::response::*;
use axum::{Json, extract::State, response::IntoResponse};
use http::StatusCode;
use std::sync::Arc;

use crate::image::use_case::ImageUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum ImageControllerError {
    #[error(transparent)]
    UseCase(#[from] ImageUseCaseError),
}

impl IntoResponse for ImageControllerError {
    fn into_response(self) -> axum::response::Response {
        tracing::error!(error = ?self, "request failed");
        let status = match &self {
            Self::UseCase(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let body = serde_json::json!({ "error": self.to_string() });
        (status, Json(body)).into_response()
    }
}

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
) -> Result<Json<FetchImagesResponse>, ImageControllerError> {
    let image_use_case = state.image_use_case.clone();

    let output = image_use_case.fetch_images().await?;

    Ok(Json(FetchImagesResponse::from(output)))
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
) -> Result<Json<Vec<ImageTagResponse>>, ImageControllerError> {
    let image_use_case = state.image_use_case.clone();

    let output = image_use_case
        .fetch_image_tags()
        .await?
        .into_iter()
        .map(ImageTagResponse::from)
        .collect::<Vec<_>>();

    Ok(Json(output))
}
