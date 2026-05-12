use crate::to_do::use_case::output::*;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Default, Debug, Serialize, ToSchema)]
pub struct ToDoResponse {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
    pub is_archived: bool,
    pub is_recurring: bool,
    pub deadline: Option<time::Date>,
    pub severity: ToDoSeverityResponse,
    pub created_at: Option<time::Date>,
    pub updated_at: Option<time::Date>,
}

#[derive(Default, Debug, Clone, Copy, PartialEq, Eq, Serialize, ToSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ToDoSeverityResponse {
    #[default]
    Unknown,
    Debug,
    Info,
    Warn,
    Error,
}

impl From<ToDoEntity> for ToDoResponse {
    fn from(value: ToDoEntity) -> Self {
        Self {
            id: value.id,
            url: value.url,
            source: value.source,
            title: value.title,
            description: value.description,
            is_done: value.is_done,
            is_archived: value.is_archived,
            is_recurring: value.is_recurring,
            deadline: value.deadline,
            severity: value.severity.into(),
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

impl From<ToDoSeverityEntity> for ToDoSeverityResponse {
    fn from(value: ToDoSeverityEntity) -> Self {
        match value {
            ToDoSeverityEntity::Unknown => Self::Unknown,
            ToDoSeverityEntity::Debug => Self::Debug,
            ToDoSeverityEntity::Info => Self::Info,
            ToDoSeverityEntity::Warn => Self::Warn,
            ToDoSeverityEntity::Error => Self::Error,
        }
    }
}
