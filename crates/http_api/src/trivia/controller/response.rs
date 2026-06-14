use crate::trivia::use_case::output::*;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
pub struct TriviaResponse {
    pub page_id: String,
    pub title: Option<String>,
    pub view_count: u32,
    pub created_at: String,
    pub updated_at: String,
    pub url: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct TriviaBlockResponse {
    pub surface: serde_json::Value,
}

impl From<TriviaEntity> for TriviaResponse {
    fn from(value: TriviaEntity) -> Self {
        Self {
            page_id: value.page_id,
            title: value.title,
            view_count: value.view_count,
            created_at: value.created_at,
            updated_at: value.updated_at,
            url: value.url,
        }
    }
}

impl From<TriviaBlockEntity> for TriviaBlockResponse {
    fn from(value: TriviaBlockEntity) -> Self {
        Self {
            surface: value.surface,
        }
    }
}
