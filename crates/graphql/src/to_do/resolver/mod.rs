pub mod mutation;
pub mod query;

use crate::to_do::use_case::output::*;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDo {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
    pub is_recurring: bool,
    pub deadline: Option<String>,
    pub severity: ToDoSeverity,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(async_graphql::Enum, Default, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToDoSeverity {
    #[default]
    Unknown,
    Backlog,
    Info,
    Warn,
    Error,
}

impl std::fmt::Display for ToDoSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                ToDoSeverity::Unknown => "UNKNOWN",
                ToDoSeverity::Backlog => "BACKLOG",
                ToDoSeverity::Info => "INFO",
                ToDoSeverity::Warn => "WARN",
                ToDoSeverity::Error => "ERROR",
            }
        )
    }
}

impl From<ToDoEntity> for ToDo {
    fn from(value: ToDoEntity) -> Self {
        Self {
            id: value.id,
            url: value.url,
            source: value.source,
            title: value.title,
            description: value.description,
            is_done: value.is_done,
            is_recurring: value.is_recurring,
            deadline: value.deadline,
            severity: value.severity.into(),
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

impl From<ToDoSeverityEntity> for ToDoSeverity {
    fn from(value: ToDoSeverityEntity) -> Self {
        match value {
            ToDoSeverityEntity::Unknown => Self::Unknown,
            ToDoSeverityEntity::Backlog => Self::Backlog,
            ToDoSeverityEntity::Info => Self::Info,
            ToDoSeverityEntity::Warn => Self::Warn,
            ToDoSeverityEntity::Error => Self::Error,
        }
    }
}
