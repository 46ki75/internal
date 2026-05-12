use serde::{Deserialize, Serialize};

use crate::to_do::controller::request::ToDoSeverityRequest;
use crate::to_do::resolver::ToDoSeverity;

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
    pub deadline: Option<String>,
    pub severity: ToDoSeverityEntity,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
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

impl From<ToDoSeverity> for ToDoSeverityEntity {
    fn from(value: ToDoSeverity) -> Self {
        match value {
            ToDoSeverity::Unknown => Self::Unknown,
            ToDoSeverity::Debug => Self::Debug,
            ToDoSeverity::Info => Self::Info,
            ToDoSeverity::Warn => Self::Warn,
            ToDoSeverity::Error => Self::Error,
        }
    }
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
