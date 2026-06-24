use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct AnkiState {
    pub anki_use_case: Arc<crate::use_case::AnkiUseCase>,
}

pub async fn init_anki_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), http_api_core::error::Error> {
    let repository = Arc::new(crate::repository::AnkiRepositoryImpl {});
    let use_case = Arc::new(crate::use_case::AnkiUseCase {
        anki_repository: repository,
    });
    let state = Arc::new(AnkiState {
        anki_use_case: use_case,
    });

    Ok(anki_router(state))
}

/// Builds the anki router from injected state. Split out from
/// [`init_anki_router`] so tests can drive it with a stub-backed use_case.
pub fn anki_router(state: Arc<AnkiState>) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(crate::controller::anki))
        .routes(routes!(crate::controller::anki_list))
        .routes(routes!(crate::controller::block_list))
        .routes(routes!(crate::controller::create_anki))
        .routes(routes!(crate::controller::update_anki))
        .with_state(state)
        .split_for_parts()
}
