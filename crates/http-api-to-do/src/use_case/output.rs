use serde::{Deserialize, Serialize};

use crate::controller::request::ToDoSeverityRequest;

#[derive(Default, Debug)]
pub struct ToDoEntity {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
    pub is_recurring: bool,
    pub is_archived: bool,
    pub deadline: Option<time::Date>,
    pub severity: ToDoSeverityEntity,
    pub created_at: Option<time::Date>,
    pub updated_at: Option<time::Date>,
}

#[derive(Default, Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ToDoSeverityEntity {
    #[default]
    Unknown,
    Debug,
    Info,
    Warn,
    Error,
}

impl From<ToDoSeverityRequest> for ToDoSeverityEntity {
    fn from(value: ToDoSeverityRequest) -> Self {
        match value {
            ToDoSeverityRequest::Unknown => Self::Unknown,
            ToDoSeverityRequest::Debug => Self::Debug,
            ToDoSeverityRequest::Info => Self::Info,
            ToDoSeverityRequest::Warn => Self::Warn,
            ToDoSeverityRequest::Error => Self::Error,
        }
    }
}
