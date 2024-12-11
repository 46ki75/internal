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
}

#[derive(async_graphql::SimpleObject)]
pub struct BookmarkTag {
    id: String,
    name: String,
    color: BookmarkTagColor,
}

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq)]
pub enum BookmarkTagColor {
    #[graphql(name = "default")]
    Default,

    #[graphql(name = "blue")]
    Blue,

    #[graphql(name = "brown")]
    Brown,

    #[graphql(name = "gray")]
    Gray,

    #[graphql(name = "green")]
    Green,

    #[graphql(name = "orange")]
    Orange,

    #[graphql(name = "pink")]
    Pink,

    #[graphql(name = "purple")]
    Purple,

    #[graphql(name = "red")]
    Red,

    #[graphql(name = "yellow")]
    Yellow,
}
