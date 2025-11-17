use axum::response::IntoResponse;
use http::{StatusCode, header::CONTENT_TYPE};

use crate::to_do::response::ToDoResponse;

#[utoipa::path(
    get,
    path = "/api/v1/to-do",
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
