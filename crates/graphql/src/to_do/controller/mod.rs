pub mod request;
pub mod response;
pub mod router;

use self::response::ToDoResponse;
use axum::response::IntoResponse;
use http::{header::CONTENT_TYPE, StatusCode};

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
        std::sync::Arc<crate::to_do::controller::router::ToDoState>,
    >,
) -> impl IntoResponse {
    let to_do_use_case = state.to_do_use_case.clone();

    let notion_to_do_list: Vec<self::response::ToDoResponse> = to_do_use_case
        .list_notion_to_do()
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .into_iter()
        .map(|to_do_entity| to_do_entity.into())
        .collect();

    serde_json::to_string(&notion_to_do_list)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(200)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}

#[utoipa::path(
    post,
    path = "/api/v1/to-do",
    request_body = self::request::CreateToDoRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmark", body = ToDoResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_to_do(
    axum::extract::State(state): axum::extract::State<
        std::sync::Arc<crate::to_do::controller::router::ToDoState>,
    >,
    axum::extract::Json(request): axum::extract::Json<self::request::CreateToDoRequest>,
) -> impl IntoResponse {
    let to_do_use_case = state.to_do_use_case.clone();

    let severity = request.severity.map(|s| s.into());

    let to_do: self::response::ToDoResponse = to_do_use_case
        .create_to_do(request.title, request.description, severity)
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .map(|to_do| to_do.into())?;

    serde_json::to_string(&to_do)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(201)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
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
        std::sync::Arc<crate::to_do::controller::router::ToDoState>,
    >,
    axum::extract::Json(request): axum::extract::Json<self::request::UpdateToDoInput>,
) -> impl IntoResponse {
    let to_do_use_case = state.to_do_use_case.clone();

    let to_do: ToDoResponse = to_do_use_case
        .update_to_do(request.id, request.is_done)
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .into();

    serde_json::to_string(&to_do)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            axum::response::Response::builder()
                .status(200)
                .header(CONTENT_TYPE, "application/json")
                .body(body_string)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}
