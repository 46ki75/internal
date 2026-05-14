pub mod request;
pub mod response;
pub mod router;

use self::response::TypingResponse;
use axum::{Json, extract::State, response::IntoResponse};
use http::StatusCode;
use std::sync::Arc;

use crate::typing::use_case::TypingUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum TypingControllerError {
    #[error(transparent)]
    UseCase(#[from] TypingUseCaseError),
}

impl IntoResponse for TypingControllerError {
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
    path = "/api/v1/typing",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Typing list", body = Vec<TypingResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn typing_list(
    State(state): State<Arc<crate::typing::controller::router::TypingState>>,
) -> Result<Json<Vec<TypingResponse>>, TypingControllerError> {
    let typing_use_case = state.typing_use_case.clone();

    let results = typing_use_case
        .typing_list()
        .await?
        .into_iter()
        .map(TypingResponse::from)
        .collect::<Vec<_>>();

    Ok(Json(results))
}

#[utoipa::path(
    post,
    path = "/api/v1/typing",
    request_body = self::request::TypingUpsertRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Upsert typing", body = TypingResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn upsert_typing(
    State(state): State<Arc<crate::typing::controller::router::TypingState>>,
    axum::extract::Json(request): axum::extract::Json<self::request::TypingUpsertRequest>,
) -> Result<Json<TypingResponse>, TypingControllerError> {
    let typing_use_case = state.typing_use_case.clone();

    let result = typing_use_case
        .upsert_typing(request.id, request.text, request.description)
        .await
        .map(TypingResponse::from)?;

    Ok(Json(result))
}

#[utoipa::path(
    delete,
    path = "/api/v1/typing",
    request_body = self::request::TypingDeleteRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Delete typing", body = TypingResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn delete_typing(
    State(state): State<Arc<crate::typing::controller::router::TypingState>>,
    axum::extract::Json(request): axum::extract::Json<self::request::TypingDeleteRequest>,
) -> Result<Json<TypingResponse>, TypingControllerError> {
    let typing_use_case = state.typing_use_case.clone();

    let result = typing_use_case
        .delete_typing(request.id)
        .await
        .map(TypingResponse::from)?;

    Ok(Json(result))
}
