use super::entity::*;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
pub struct IconResponse {
    pub id: String,
    pub url: String,
}

impl From<IconEntiry> for IconResponse {
    fn from(value: IconEntiry) -> Self {
        Self {
            id: value.id,
            url: value.url,
        }
    }
}
