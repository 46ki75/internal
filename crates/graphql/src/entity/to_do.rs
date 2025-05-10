#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDo {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
    pub deadline: Option<String>,
    pub severity: Severity,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(async_graphql::Enum, Default, Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    #[default]
    Unknown,
    Info,
    Warn,
    Error,
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Severity::Unknown => "INFO",
                Severity::Info => "INFO",
                Severity::Warn => "WARN",
                Severity::Error => "ERROR",
            }
        )
    }
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDoConnection {
    pub edges: Vec<ToDoEdge>,
    pub page_info: crate::entity::PageInfo,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDoEdge {
    pub node: ToDo,
    pub cursor: String,
}
