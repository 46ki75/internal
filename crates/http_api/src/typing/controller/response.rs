use crate::typing::use_case::output::TypingEntity;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Default, Debug, Serialize, ToSchema)]
pub struct TypingResponse {
    pub id: String,
    pub text: String,
    pub description: String,
}

impl From<TypingEntity> for TypingResponse {
    fn from(value: TypingEntity) -> Self {
        Self {
            id: value.id,
            text: value.text,
            description: value.description,
        }
    }
}
