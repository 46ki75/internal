use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct BookmarkState {
    pub bookmark_use_case: Arc<crate::bookmark::use_case::BookmarkUseCase>,
}

pub async fn init_bookmark_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let repository = Arc::new(crate::bookmark::repository::BookmarkRepositoryImpl {});
    let use_case = Arc::new(crate::bookmark::use_case::BookmarkUseCase {
        bookmark_repository: repository,
    });
    let state = Arc::new(BookmarkState {
        bookmark_use_case: use_case,
    });

    Ok(bookmark_router(state))
}

/// Builds the bookmark router from injected state. Split out from
/// [`init_bookmark_router`] so tests can drive it with a stub-backed use_case.
pub fn bookmark_router(state: Arc<BookmarkState>) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(crate::bookmark::controller::bookmark_list))
        .routes(routes!(crate::bookmark::controller::create_bookmark))
        .with_state(state)
        .split_for_parts()
}
