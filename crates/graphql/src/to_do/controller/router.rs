use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct ToDoState {
    pub to_do_use_case: Arc<crate::to_do::use_case::ToDoUseCase>,
}

pub async fn init_to_do_router(
) -> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let use_case = Arc::new(crate::to_do::use_case::ToDoUseCase {
        to_do_repository: Arc::new(crate::to_do::repository::ToDoRepositoryImpl {}),
    });
    let state = Arc::new(ToDoState { to_do_use_case: use_case });

    let (router, api) = OpenApiRouter::new()
        .routes(routes!(crate::to_do::controller::to_do_list))
        .routes(routes!(crate::to_do::controller::create_to_do))
        .routes(routes!(crate::to_do::controller::update_to_do))
        .with_state(state)
        .split_for_parts();

    Ok((router, api))
}
