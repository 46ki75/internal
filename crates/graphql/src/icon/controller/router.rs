use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct IconState {
    pub icon_use_case: Arc<crate::icon::use_case::IconUseCase>,
}

pub async fn init_icon_router(
) -> Result<(axum::Router, utoipa::openapi::OpenApi), crate::error::Error> {
    let use_case = Arc::new(crate::icon::use_case::IconUseCase {
        icon_repository: Arc::new(crate::icon::repository::IconRepositoryImpl::default()),
    });
    let state = Arc::new(IconState { icon_use_case: use_case });

    let (router, api) = OpenApiRouter::new()
        .routes(routes!(crate::icon::controller::list_icons))
        .with_state(state)
        .split_for_parts();

    Ok((router, api))
}
