use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct ToDoState {
    pub to_do_use_case: Arc<crate::use_case::ToDoUseCase>,
}

pub async fn init_to_do_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), http_api_core::error::Error> {
    let use_case = Arc::new(crate::use_case::ToDoUseCase {
        to_do_repository: Arc::new(crate::repository::ToDoRepositoryImpl {}),
    });
    let state = Arc::new(ToDoState {
        to_do_use_case: use_case,
    });

    Ok(to_do_router(state))
}

/// Builds the to_do router from injected state. Split out from
/// [`init_to_do_router`] so tests can drive it with a stub-backed use_case.
pub fn to_do_router(state: Arc<ToDoState>) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(crate::controller::to_do_list))
        .routes(routes!(crate::controller::create_to_do))
        .routes(routes!(crate::controller::update_to_do))
        .with_state(state)
        .split_for_parts()
}
