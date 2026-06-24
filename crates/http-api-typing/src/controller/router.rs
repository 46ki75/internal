use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct TypingState {
    pub typing_use_case: Arc<crate::use_case::TypingUseCase>,
}

pub async fn init_typing_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), http_api_core::error::Error> {
    let use_case = Arc::new(crate::use_case::TypingUseCase {
        typing_repository: Arc::new(crate::repository::TypingRepositoryImpl {}),
    });
    let state = Arc::new(TypingState {
        typing_use_case: use_case,
    });

    Ok(typing_router(state))
}

/// Builds the typing router from injected state. Split out from
/// [`init_typing_router`] so tests can drive it with a stub-backed use_case.
pub fn typing_router(state: Arc<TypingState>) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(crate::controller::typing_list))
        .routes(routes!(crate::controller::upsert_typing))
        .routes(routes!(crate::controller::delete_typing))
        .with_state(state)
        .split_for_parts()
}
