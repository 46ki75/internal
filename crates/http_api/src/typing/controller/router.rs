use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct TypingState {
    pub typing_use_case: Arc<crate::typing::use_case::TypingUseCase>,
}

pub async fn init_typing_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let use_case = Arc::new(crate::typing::use_case::TypingUseCase {
        typing_repository: Arc::new(crate::typing::repository::TypingRepositoryImpl {}),
    });
    let state = Arc::new(TypingState {
        typing_use_case: use_case,
    });

    let (router, api) = OpenApiRouter::new()
        .routes(routes!(crate::typing::controller::typing_list))
        .routes(routes!(crate::typing::controller::upsert_typing))
        .routes(routes!(crate::typing::controller::delete_typing))
        .with_state(state)
        .split_for_parts();

    Ok((router, api))
}
