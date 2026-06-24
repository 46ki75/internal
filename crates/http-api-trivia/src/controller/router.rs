use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct TriviaState {
    pub trivia_use_case: Arc<crate::use_case::TriviaUseCase>,
}

pub async fn init_trivia_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), http_api_core::error::Error> {
    let repository = Arc::new(crate::repository::TriviaRepositoryImpl {});
    let use_case = Arc::new(crate::use_case::TriviaUseCase {
        trivia_repository: repository,
    });
    let state = Arc::new(TriviaState {
        trivia_use_case: use_case,
    });

    Ok(trivia_router(state))
}

/// Builds the trivia router from injected state. Split out from
/// [`init_trivia_router`] so tests can drive it with a stub-backed use_case.
pub fn trivia_router(state: Arc<TriviaState>) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(crate::controller::trivia_list))
        .routes(routes!(crate::controller::trivia_block_list))
        .routes(routes!(crate::controller::increment_view))
        .with_state(state)
        .split_for_parts()
}
