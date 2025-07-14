pub mod mutation;
pub mod query;

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
                ToDoSeverity::Unknown => "INFO",
                ToDoSeverity::Info => "INFO",
                ToDoSeverity::Warn => "WARN",
                ToDoSeverity::Error => "ERROR",
            }
        )
    }
}

impl From<crate::entity::to_do::ToDoEntity> for ToDo {
    fn from(value: crate::entity::to_do::ToDoEntity) -> Self {
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

impl From<crate::entity::to_do::ToDoSeverityEntity> for ToDoSeverity {
    fn from(value: crate::entity::to_do::ToDoSeverityEntity) -> Self {
        match value {
            crate::entity::to_do::ToDoSeverityEntity::Unknown => Self::Unknown,
            crate::entity::to_do::ToDoSeverityEntity::Info => Self::Info,
            crate::entity::to_do::ToDoSeverityEntity::Warn => Self::Warn,
            crate::entity::to_do::ToDoSeverityEntity::Error => Self::Error,
        }
    }
}
