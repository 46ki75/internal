use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct TriviaState {
    pub trivia_use_case: Arc<crate::trivia::use_case::TriviaUseCase>,
}

pub async fn init_trivia_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let repository = Arc::new(crate::trivia::repository::TriviaRepositoryImpl {});
    let use_case = Arc::new(crate::trivia::use_case::TriviaUseCase {
        trivia_repository: repository,
    });
    let state = Arc::new(TriviaState {
        trivia_use_case: use_case,
    });

    let (router, api) = OpenApiRouter::new()
        .routes(routes!(crate::trivia::controller::trivia_list))
        .routes(routes!(crate::trivia::controller::trivia_block_list))
        .routes(routes!(crate::trivia::controller::increment_view))
        .with_state(state)
        .split_for_parts();

    Ok((router, api))
}
