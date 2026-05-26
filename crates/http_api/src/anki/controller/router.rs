use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct AnkiState {
    pub anki_use_case: Arc<crate::anki::use_case::AnkiUseCase>,
}

pub async fn init_anki_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let repository = Arc::new(crate::anki::repository::AnkiRepositoryImpl {});
    let use_case = Arc::new(crate::anki::use_case::AnkiUseCase {
        anki_repository: repository,
    });
    let state = Arc::new(AnkiState {
        anki_use_case: use_case,
    });

    let (router, api) = OpenApiRouter::new()
        .routes(routes!(crate::anki::controller::anki))
        .routes(routes!(crate::anki::controller::anki_list))
        .routes(routes!(crate::anki::controller::block_list))
        .routes(routes!(crate::anki::controller::create_anki))
        .routes(routes!(crate::anki::controller::update_anki))
        .with_state(state)
        .split_for_parts();

    Ok((router, api))
}
