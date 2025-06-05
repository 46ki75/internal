#[derive(Default, Debug)]
pub struct ToDoEntity {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
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

impl From<crate::resolver::to_do::ToDoSeverity> for ToDoSeverityEntity {
    fn from(value: crate::resolver::to_do::ToDoSeverity) -> Self {
        match value {
            crate::resolver::to_do::ToDoSeverity::Unknown => Self::Unknown,
            crate::resolver::to_do::ToDoSeverity::Info => Self::Info,
            crate::resolver::to_do::ToDoSeverity::Warn => Self::Warn,
            crate::resolver::to_do::ToDoSeverity::Error => Self::Error,
        }
    }
}
