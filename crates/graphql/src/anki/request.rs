use serde::Deserialize;
use utoipa::{IntoParams, ToSchema};

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct ListAnkiQueryParams {
    pub page_size: Option<u8>,
    pub next_cursor: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateAnkiRequest {
    pub title: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateAnkiRequest {
    pub ease_factor: Option<f64>,
    pub repetition_count: Option<u32>,
    pub next_review_at: Option<String>,
    pub is_review_required: Option<bool>,
    pub in_trash: Option<bool>,
}
