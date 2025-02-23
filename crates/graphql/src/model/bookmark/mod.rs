pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject)]
pub struct BookmarkConnection {
    pub edges: Vec<BookmarkEdge>,
    pub page_info: crate::model::PageInfo,
}

#[derive(async_graphql::SimpleObject)]
pub struct BookmarkEdge {
    pub node: Bookmark,
    pub cursor: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct Bookmark {
    pub id: String,
    pub name: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
    pub tags: Vec<BookmarkTag>,
    pub notion_url: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct BookmarkTag {
    pub id: String,
    pub name: String,
    pub color: String,
}
