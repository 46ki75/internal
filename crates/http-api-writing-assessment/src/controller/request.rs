use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateWritingAssessmentRequest {
    pub text: String,
    pub japanese_context: Option<String>,
}
