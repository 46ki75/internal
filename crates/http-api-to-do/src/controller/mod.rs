pub mod request;
pub mod response;
pub mod router;

use self::response::ToDoResponse;
use axum::{Json, response::IntoResponse};
use http::StatusCode;

use crate::use_case::ToDoUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum ToDoControllerError {
    #[error(transparent)]
    UseCase(#[from] ToDoUseCaseError),
}

impl IntoResponse for ToDoControllerError {
    fn into_response(self) -> axum::response::Response {
        let status = match &self {
            Self::UseCase(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        http_api_core::error::render_error_response(status, &self)
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/to-do",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmark", body = Vec<ToDoResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn to_do_list(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::controller::router::ToDoState>,
    >,
) -> Result<Json<Vec<ToDoResponse>>, ToDoControllerError> {
    let to_do_use_case = state.to_do_use_case.clone();

    let notion_to_do_list = to_do_use_case
        .list_notion_to_do()
        .await?
        .into_iter()
        .map(|to_do_entity| to_do_entity.into())
        .collect::<Vec<ToDoResponse>>();

    Ok(Json(notion_to_do_list))
}

#[utoipa::path(
    post,
    path = "/api/v1/to-do",
    request_body = self::request::CreateToDoRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 201, description = "Bookmark", body = ToDoResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_to_do(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::controller::router::ToDoState>,
    >,
    axum::extract::Json(request): axum::extract::Json<self::request::CreateToDoRequest>,
) -> Result<(StatusCode, Json<ToDoResponse>), ToDoControllerError> {
    let to_do_use_case = state.to_do_use_case.clone();

    let severity = request.severity.map(|s| s.into());

    let to_do: ToDoResponse = to_do_use_case
        .create_to_do(
            request.title,
            request.description,
            severity,
            request.deadline,
        )
        .await?
        .into();

    Ok((StatusCode::CREATED, Json(to_do)))
}

#[utoipa::path(
    put,
    path = "/api/v1/to-do",
    request_body = self::request::UpdateToDoInput,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmark", body = ToDoResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn update_to_do(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::controller::router::ToDoState>,
    >,
    axum::extract::Json(request): axum::extract::Json<self::request::UpdateToDoInput>,
) -> Result<Json<ToDoResponse>, ToDoControllerError> {
    let to_do_use_case = state.to_do_use_case.clone();

    let to_do: ToDoResponse = to_do_use_case
        .update_to_do(request.id, request.is_done)
        .await?
        .into();

    Ok(Json(to_do))
}
