use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateBookmarkRequestBody {
    pub name: String,
    pub url: String,
}
