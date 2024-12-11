pub mod anki;
pub mod bookmark;
pub mod translation;

#[derive(async_graphql::SimpleObject)]
pub struct RelayConnection<T: async_graphql::OutputType> {
    pub edges: Vec<RelayEdge<T>>,
    pub page_info: PageInfo,
}

#[derive(async_graphql::SimpleObject)]
pub struct RelayEdge<T: async_graphql::OutputType> {
    pub node: T,
    pub cursor: String,
}

#[derive(async_graphql::SimpleObject, Default)]
pub struct PageInfo {
    pub has_next_page: bool,
    pub has_previous_page: bool,
    pub start_cursor: Option<String>,
    pub end_cursor: Option<String>,
    pub next_cursor: Option<String>,
}
