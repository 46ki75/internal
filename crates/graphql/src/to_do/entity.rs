use super::request::*;
use super::resolver::*;

#[derive(Default, Debug)]
pub struct ToDoEntity {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
    pub is_recurring: bool,
    pub deadline: Option<String>,
    pub severity: ToDoSeverityEntity,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Default, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToDoSeverityEntity {
    #[default]
    Unknown,
    Info,
    Warn,
    Error,
}

impl std::fmt::Display for ToDoSeverityEntity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                ToDoSeverityEntity::Unknown => "INFO",
                ToDoSeverityEntity::Info => "INFO",
                ToDoSeverityEntity::Warn => "WARN",
                ToDoSeverityEntity::Error => "ERROR",
            }
        )
    }
}

impl From<ToDoSeverity> for ToDoSeverityEntity {
    fn from(value: ToDoSeverity) -> Self {
        match value {
            ToDoSeverity::Unknown => Self::Unknown,
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
            ToDoSeverityRequest::Info => Self::Info,
            ToDoSeverityRequest::Warn => Self::Warn,
            ToDoSeverityRequest::Error => Self::Error,
        }
    }
}
