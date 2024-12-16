pub mod query;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDo {
    pub id: String,
    pub url: String,
    pub source: String,
    pub title: String,
    pub description: Option<String>,
    pub is_done: bool,
    pub deadline: Option<String>,
    pub severity: Sevelity,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(async_graphql::Enum, Default, Debug, Clone, Copy, PartialEq, Eq)]
pub enum Sevelity {
    #[default]
    Unknown,
    Info,
    Warn,
    Error,
    Fatal,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDoConnection {
    pub edges: Vec<ToDoEdge>,
    pub page_info: crate::model::PageInfo,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct ToDoEdge {
    pub node: ToDo,
    pub cursor: String,
}
