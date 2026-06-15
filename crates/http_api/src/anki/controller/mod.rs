pub mod request;
pub mod response;
pub mod router;

use self::request::*;
use self::response::*;
use axum::{Json, response::IntoResponse};
use http::StatusCode;

use crate::anki::use_case::AnkiUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum AnkiControllerError {
    #[error(transparent)]
    UseCase(#[from] AnkiUseCaseError),
}

impl IntoResponse for AnkiControllerError {
    fn into_response(self) -> axum::response::Response {
        let status = match &self {
            Self::UseCase(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        crate::error::render_error_response(status, &self)
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/anki/{page_id}",
    params(
        ("Authorization" = String, Header),
        ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Anki", body = AnkiResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn anki(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::anki::controller::router::AnkiState>,
    >,
    axum::extract::Path(page_id): axum::extract::Path<String>,
) -> Result<Json<AnkiResponse>, AnkiControllerError> {
    let anki_use_case = state.anki_use_case.clone();

    let anki_entity: AnkiResponse = anki_use_case.get_anki_by_id(&page_id).await?.into();

    Ok(Json(anki_entity))
}

#[utoipa::path(
    get,
    path = "/api/v1/anki",
    params(
        ("Authorization" = String, Header),
        ListAnkiQueryParams
    ),
    responses(
        (status = 200, description = "Anki", body = Vec<AnkiResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn anki_list(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::anki::controller::router::AnkiState>,
    >,
    axum::extract::Query(query_params): axum::extract::Query<ListAnkiQueryParams>,
) -> Result<Json<Vec<AnkiResponse>>, AnkiControllerError> {
    let anki_use_case = state.anki_use_case.clone();

    let anki_entities = anki_use_case
        .list_anki(
            query_params.page_size.unwrap_or(100).into(),
            query_params.next_cursor,
        )
        .await?
        .0
        .into_iter()
        .map(|anki| anki.into())
        .collect::<Vec<AnkiResponse>>();

    Ok(Json(anki_entities))
}

#[utoipa::path(
    get,
    path = "/api/v1/anki/block/{page_id}",
    params(
        ("Authorization" = String, Header),
        ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Anki", body = AnkiBlockResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn block_list(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::anki::controller::router::AnkiState>,
    >,
    axum::extract::Path(page_id): axum::extract::Path<String>,
) -> Result<Json<AnkiBlockResponse>, AnkiControllerError> {
    let anki_use_case = state.anki_use_case.clone();

    let result: AnkiBlockResponse = anki_use_case.list_blocks(&page_id).await?.into();

    Ok(Json(result))
}

#[utoipa::path(
    post,
    path = "/api/v1/anki",
    params(
        ("Authorization" = String, Header),
    ),
    request_body = CreateAnkiRequest,
    responses(
        (status = 201, description = "Anki", body = AnkiResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_anki(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::anki::controller::router::AnkiState>,
    >,
    axum::extract::Json(request): axum::extract::Json<CreateAnkiRequest>,
) -> Result<(StatusCode, Json<AnkiResponse>), AnkiControllerError> {
    let anki_use_case = state.anki_use_case.clone();

    let anki_entity: AnkiResponse = anki_use_case.create_anki(request.title).await?.into();

    Ok((StatusCode::CREATED, Json(anki_entity)))
}

#[utoipa::path(
    put,
    path = "/api/v1/anki/{page_id}",
    request_body = UpdateAnkiRequest,
    params(
        ("Authorization" = String, Header),
        ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Anki", body = AnkiResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn update_anki(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::anki::controller::router::AnkiState>,
    >,
    axum::extract::Path(page_id): axum::extract::Path<String>,
    axum::extract::Json(UpdateAnkiRequest {
        ease_factor,
        repetition_count,
        next_review_at,
        is_review_required,
        in_trash,
    }): axum::extract::Json<UpdateAnkiRequest>,
) -> Result<Json<AnkiResponse>, AnkiControllerError> {
    let anki_use_case = state.anki_use_case.clone();

    let anki_response: AnkiResponse = anki_use_case
        .update_anki(
            page_id.as_ref(),
            ease_factor,
            repetition_count,
            next_review_at,
            is_review_required,
            in_trash,
        )
        .await?
        .into();

    Ok(Json(anki_response))
}
