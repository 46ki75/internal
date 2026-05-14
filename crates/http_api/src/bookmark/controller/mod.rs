pub mod request;
pub mod response;
pub mod router;

use axum::{Json, response::IntoResponse};
use http::StatusCode;

use self::request::CreateBookmarkRequestBody;
use self::response::*;
use crate::bookmark::use_case::BookmarkUseCaseError;

#[derive(Debug, thiserror::Error)]
pub enum BookmarkControllerError {
    #[error(transparent)]
    UseCase(#[from] BookmarkUseCaseError),
}

impl IntoResponse for BookmarkControllerError {
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
    path = "/api/v1/bookmark",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Bookmarks", body = Vec<BookmarkResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn bookmark_list(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::bookmark::controller::router::BookmarkState>>,
) -> Result<Json<Vec<BookmarkResponse>>, BookmarkControllerError> {
    let bookmark_use_case = state.bookmark_use_case.clone();

    let bookmarks = bookmark_use_case
        .list_bookmark()
        .await?
        .into_iter()
        .map(BookmarkResponse::from)
        .collect::<Vec<BookmarkResponse>>();

    Ok(Json(bookmarks))
}

#[utoipa::path(
    post,
    path = "/api/v1/bookmark",
    params(
        ("Authorization" = String, Header),
    ),
    request_body = CreateBookmarkRequestBody,
    responses(
        (status = 200, description = "Bookmark", body = BookmarkResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_bookmark(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::bookmark::controller::router::BookmarkState>>,
    axum::extract::Json(payload): axum::extract::Json<CreateBookmarkRequestBody>,
) -> Result<Json<BookmarkResponse>, BookmarkControllerError> {
    let bookmark_use_case = state.bookmark_use_case.clone();

    let bookmark = bookmark_use_case
        .create_bookmark(&payload.name, &payload.url)
        .await
        .map(BookmarkResponse::from)?;

    Ok(Json(bookmark))
}
