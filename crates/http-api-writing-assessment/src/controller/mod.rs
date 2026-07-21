pub mod request;
pub mod router;

use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State},
    response::IntoResponse,
};
use http::StatusCode;

use crate::use_case::{WritingAssessmentUseCaseError, domain::Assessment};
use request::CreateWritingAssessmentRequest;
use router::WritingAssessmentState;

#[derive(Debug, thiserror::Error)]
pub enum WritingAssessmentControllerError {
    #[error(transparent)]
    UseCase(#[from] WritingAssessmentUseCaseError),
}

impl IntoResponse for WritingAssessmentControllerError {
    fn into_response(self) -> axum::response::Response {
        let status = match &self {
            Self::UseCase(WritingAssessmentUseCaseError::BlankText) => StatusCode::BAD_REQUEST,
            Self::UseCase(WritingAssessmentUseCaseError::NotFound(_)) => StatusCode::NOT_FOUND,
            Self::UseCase(WritingAssessmentUseCaseError::Generator(_)) => StatusCode::BAD_GATEWAY,
            Self::UseCase(WritingAssessmentUseCaseError::Persistence(_)) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        };
        http_api_core::error::render_error_response(status, &self)
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/writing-assessments",
    request_body = CreateWritingAssessmentRequest,
    params(("Authorization" = String, Header)),
    responses(
        (status = 201, description = "Writing assessment created", body = Assessment),
        (status = 400, description = "Text is blank"),
        (status = 502, description = "Generator failure")
    )
)]
pub async fn create_writing_assessment(
    State(state): State<Arc<WritingAssessmentState>>,
    Json(request): Json<CreateWritingAssessmentRequest>,
) -> Result<(StatusCode, Json<Assessment>), WritingAssessmentControllerError> {
    let assessment = state
        .use_case
        .create(request.text, request.japanese_context)
        .await?;
    Ok((StatusCode::CREATED, Json(assessment)))
}

#[utoipa::path(
    get,
    path = "/api/v1/writing-assessments",
    params(("Authorization" = String, Header)),
    responses((status = 200, description = "Writing assessments", body = Vec<Assessment>))
)]
pub async fn list_writing_assessments(
    State(state): State<Arc<WritingAssessmentState>>,
) -> Result<Json<Vec<Assessment>>, WritingAssessmentControllerError> {
    Ok(Json(state.use_case.list().await?))
}

#[utoipa::path(
    get,
    path = "/api/v1/writing-assessments/{id}",
    params(
        ("Authorization" = String, Header),
        ("id" = String, Path, description = "Writing assessment ID")
    ),
    responses(
        (status = 200, description = "Writing assessment", body = Assessment),
        (status = 404, description = "Writing assessment not found")
    )
)]
pub async fn get_writing_assessment(
    State(state): State<Arc<WritingAssessmentState>>,
    Path(id): Path<String>,
) -> Result<Json<Assessment>, WritingAssessmentControllerError> {
    Ok(Json(state.use_case.get(&id).await?))
}

#[utoipa::path(
    delete,
    path = "/api/v1/writing-assessments/{id}",
    params(
        ("Authorization" = String, Header),
        ("id" = String, Path, description = "Writing assessment ID")
    ),
    responses(
        (status = 200, description = "Deleted writing assessment", body = Assessment),
        (status = 404, description = "Writing assessment not found")
    )
)]
pub async fn delete_writing_assessment(
    State(state): State<Arc<WritingAssessmentState>>,
    Path(id): Path<String>,
) -> Result<Json<Assessment>, WritingAssessmentControllerError> {
    Ok(Json(state.use_case.delete(&id).await?))
}
