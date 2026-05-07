use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Debug, Default, Deserialize, ToSchema)]
pub struct CreateToDoRequest {
    pub title: String,
    pub description: Option<String>,
    pub severity: Option<ToDoSeverityRequest>,
}

#[derive(Default, Debug, Clone, Copy, PartialEq, Eq, Deserialize, ToSchema)]
pub enum ToDoSeverityRequest {
    #[default]
    Unknown,
    Info,
    Warn,
    Error,
}

#[derive(Debug, Default, Deserialize, ToSchema)]
pub struct UpdateToDoInput {
    pub id: String,
    pub is_done: bool,
}
