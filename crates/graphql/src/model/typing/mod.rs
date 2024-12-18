pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct Typing {
    pub id: String,
    pub text: String,
    pub description: String,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct TypingConnection {
    pub edges: Vec<TypingEdge>,
    pub page_info: crate::model::PageInfo,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct TypingEdge {
    pub node: Typing,
    pub cursor: String,
}
