use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum AssessmentLabel {
    HardToFollow,
    Awkward,
    ClearButNonNative,
    NearNative,
    NativeLike,
}

impl AssessmentLabel {
    pub fn for_score(score: u8) -> Option<Self> {
        match score {
            1 => Some(Self::HardToFollow),
            2 => Some(Self::Awkward),
            3 => Some(Self::ClearButNonNative),
            4 => Some(Self::NearNative),
            5 => Some(Self::NativeLike),
            _ => None,
        }
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FeedbackType {
    Error,
    IntentCheck,
    Observation,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FeedbackLayer {
    Idiom,
    Style,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Low,
    Medium,
    High,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, ToSchema)]
pub struct Feedback {
    pub id: String,
    #[serde(rename = "type")]
    pub feedback_type: FeedbackType,
    pub layer: Option<FeedbackLayer>,
    pub severity: Severity,
    pub pattern: Option<String>,
    pub original: String,
    pub revised: String,
    pub reason: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, ToSchema)]
pub struct Assessment {
    pub id: String,
    pub original_text: String,
    pub japanese_context: Option<String>,
    pub score: u8,
    pub label: AssessmentLabel,
    pub justification: String,
    pub feedback: Vec<Feedback>,
    pub revised_text: Option<String>,
    pub register: String,
    pub model: String,
    pub created_at: String,
    pub schema_version: u8,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct GeneratedFeedback {
    #[serde(rename = "type")]
    pub feedback_type: FeedbackType,
    pub layer: Option<FeedbackLayer>,
    pub severity: Severity,
    pub pattern: Option<String>,
    pub original: String,
    pub revised: String,
    pub reason: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct GeneratedAssessment {
    pub score: u8,
    pub label: AssessmentLabel,
    pub justification: String,
    pub feedback: Vec<GeneratedFeedback>,
    pub revised_text: Option<String>,
    pub register: String,
}
