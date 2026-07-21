use std::sync::Arc;

use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    repository::{DynamoDbAssessmentPersistence, OpenRouterAssessmentGenerator},
    use_case::WritingAssessmentUseCase,
};

#[derive(Clone)]
pub struct WritingAssessmentState {
    pub use_case: Arc<WritingAssessmentUseCase>,
}

pub async fn init_writing_assessment_router()
-> Result<(axum::Router, utoipa::openapi::OpenApi), http_api_core::error::Error> {
    let state = Arc::new(WritingAssessmentState {
        use_case: Arc::new(WritingAssessmentUseCase {
            generator: Arc::new(OpenRouterAssessmentGenerator),
            persistence: Arc::new(DynamoDbAssessmentPersistence),
        }),
    });
    Ok(writing_assessment_router(state))
}

pub fn writing_assessment_router(
    state: Arc<WritingAssessmentState>,
) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::new()
        .routes(routes!(
            crate::controller::create_writing_assessment,
            crate::controller::list_writing_assessments
        ))
        .routes(routes!(
            crate::controller::get_writing_assessment,
            crate::controller::delete_writing_assessment
        ))
        .with_state(state)
        .split_for_parts()
}
