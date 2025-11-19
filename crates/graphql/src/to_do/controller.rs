use axum::{response::IntoResponse};
use http::{StatusCode, header::CONTENT_TYPE};

use crate::to_do::response::ToDoResponse;

#[utoipa::path(
    get,
    path = "/api/v1/to-do",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmark", body = ToDoResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn to_do_list(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
) -> impl IntoResponse {
    let to_do_service = state.to_do_service.clone();

    let notion_to_do_list: Vec<super::response::ToDoResponse> = to_do_service
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
    path = "/api/v1/to-do",request_body = super::request::CreateToDoRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmark", body = ToDoResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_to_do(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Json(request): axum::extract::Json<super::request::CreateToDoRequest>,
) -> impl IntoResponse {
    let to_do_service = state.to_do_service.clone();

    let severity = request.severity.map(|s| s.into());

    let to_do: super::response::ToDoResponse = to_do_service
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
    path = "/api/v1/to-do",request_body = super::request::UpdateToDoInput,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmark", body = ToDoResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn update_to_do(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Json(request): axum::extract::Json<super::request::UpdateToDoInput>,
) -> impl IntoResponse {
    let to_do_service = state.to_do_service.clone();

    let to_do: ToDoResponse = to_do_service
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
