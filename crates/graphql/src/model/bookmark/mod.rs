pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject)]
pub struct BookmarkMeta {
    pub id: String,
    pub name: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
}
