use axum::response::IntoResponse;
use http::{StatusCode, header::CONTENT_TYPE};

use crate::bookmark::request::CreateBookmarkRequestBody;

use super::response::*;

#[utoipa::path(
    get,
    path = "/api/v1/bookmark",
    responses(
        (status = 200, description = "Bookmarks", body = Vec<BookmarkResponse>),
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
            (status, message)
        })?
        .into_iter()
        .map(BookmarkResponse::from)
        .collect::<Vec<BookmarkResponse>>();

    serde_json::to_string(&bookmarks)
        .map_err(|e| {
            let status = http::StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(StatusCode::OK)
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
    path = "/api/v1/bookmark",
    request_body = CreateBookmarkRequestBody,
    responses(
        (status = 200, description = "Bookmark", body = BookmarkResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_bookmark(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Json(payload): axum::extract::Json<CreateBookmarkRequestBody>,
) -> impl IntoResponse {
    let bookmark_service = state.bookmark_service.clone();

    let bookmark = bookmark_service
        .create_bookmark(&payload.name, &payload.url)
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .map(BookmarkResponse::from)?;

    serde_json::to_string(&bookmark)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(StatusCode::OK)
                .header(CONTENT_TYPE, "aplication/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}
