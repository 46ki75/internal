pub mod anki;
pub mod bookmark;
pub mod routine;
pub mod todo;
pub mod typing;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct PageInfo {
    pub has_next_page: bool,
    pub has_previous_page: bool,
    pub start_cursor: Option<String>,
    pub end_cursor: Option<String>,
    pub next_cursor: Option<String>,
}
