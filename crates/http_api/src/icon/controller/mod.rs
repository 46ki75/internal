pub mod response;
pub mod router;

use self::response::*;
use axum::{Json, extract::State, response::IntoResponse};
use http::StatusCode;
use std::sync::Arc;

use crate::icon::use_case::IconUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum IconControllerError {
    #[error(transparent)]
    UseCase(#[from] IconUseCaseError),
}

impl IntoResponse for IconControllerError {
    fn into_response(self) -> axum::response::Response {
        let status = match &self {
            Self::UseCase(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        crate::error::render_error_response(status, &self)
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/icon",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Icon", body = Vec<IconResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn list_icons(
    State(state): State<Arc<crate::icon::controller::router::IconState>>,
) -> Result<Json<Vec<IconResponse>>, IconControllerError> {
    let icon_use_case = state.icon_use_case.clone();

    let icon_responses = icon_use_case
        .list_icons()
        .await?
        .into_iter()
        .map(IconResponse::from)
        .collect::<Vec<IconResponse>>();

    Ok(Json(icon_responses))
}
