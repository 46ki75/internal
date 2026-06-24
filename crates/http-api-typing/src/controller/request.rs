use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Debug, Default, Deserialize, ToSchema)]
pub struct TypingUpsertRequest {
    pub id: Option<String>,
    pub text: String,
    pub description: String,
}

#[derive(Debug, Default, Deserialize, ToSchema)]
pub struct TypingDeleteRequest {
    pub id: String,
}
