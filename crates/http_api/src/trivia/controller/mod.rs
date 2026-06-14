pub mod request;
pub mod response;
pub mod router;

use self::request::*;
use self::response::*;
use axum::{Json, response::IntoResponse};
use http::StatusCode;

use crate::trivia::use_case::TriviaUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum TriviaControllerError {
    #[error(transparent)]
    UseCase(#[from] TriviaUseCaseError),
}

impl IntoResponse for TriviaControllerError {
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
    path = "/api/v1/trivia",
    params(
        ("Authorization" = String, Header),
        ListTriviaQueryParams
    ),
    responses(
        (status = 200, description = "Trivia", body = Vec<TriviaResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn trivia_list(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::trivia::controller::router::TriviaState>,
    >,
    axum::extract::Query(query_params): axum::extract::Query<ListTriviaQueryParams>,
) -> Result<Json<Vec<TriviaResponse>>, TriviaControllerError> {
    let trivia_use_case = state.trivia_use_case.clone();

    let trivia_entities = trivia_use_case
        .list_trivia(query_params.page_size.unwrap_or(100).into())
        .await?
        .into_iter()
        .map(|trivia| trivia.into())
        .collect::<Vec<TriviaResponse>>();

    Ok(Json(trivia_entities))
}

#[utoipa::path(
    get,
    path = "/api/v1/trivia/block/{page_id}",
    params(
        ("Authorization" = String, Header),
        ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Trivia", body = TriviaBlockResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn trivia_block_list(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::trivia::controller::router::TriviaState>,
    >,
    axum::extract::Path(page_id): axum::extract::Path<String>,
) -> Result<Json<TriviaBlockResponse>, TriviaControllerError> {
    let trivia_use_case = state.trivia_use_case.clone();

    let result: TriviaBlockResponse = trivia_use_case.list_blocks(&page_id).await?.into();

    Ok(Json(result))
}

#[utoipa::path(
    post,
    path = "/api/v1/trivia/{page_id}/view",
    params(
        ("Authorization" = String, Header),
        ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Trivia", body = TriviaResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn increment_view(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::trivia::controller::router::TriviaState>,
    >,
    axum::extract::Path(page_id): axum::extract::Path<String>,
) -> Result<Json<TriviaResponse>, TriviaControllerError> {
    let trivia_use_case = state.trivia_use_case.clone();

    let trivia: TriviaResponse = trivia_use_case.increment_view(&page_id).await?.into();

    Ok(Json(trivia))
}
