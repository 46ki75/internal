use axum::response::IntoResponse;
use http::{StatusCode, header::CONTENT_TYPE};

use super::response::*;

#[utoipa::path(
    get,
    path = "/api/v1/bookmark",
    responses(
        (status = 200, description = "Blogs", body = Vec<BookmarkResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn bookmark_list(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
) -> impl IntoResponse {
    let bookmark_service = state.bookmark_service.clone();

    let bookmarks = bookmark_service
        .list_bookmark()
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            let error_response = (status, message);
            error_response
        })?
        .into_iter()
        .map(BookmarkResponse::from)
        .collect::<Vec<BookmarkResponse>>();

    let response = serde_json::to_string(&bookmarks)
        .map_err(|e| {
            let status = http::StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            let error_response = (status, message);
            error_response
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            let response = axum::response::Response::builder()
                .status(StatusCode::OK)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    let error_response = (status, message);
                    error_response
                });
            response
        });

    response
}
