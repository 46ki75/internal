use serde::Deserialize;
use utoipa::IntoParams;

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct ListAnkiQueryParams {
    pub page_size: Option<u8>,
    pub next_cursor: Option<String>,
}
