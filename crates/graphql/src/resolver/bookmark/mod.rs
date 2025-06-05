pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject)]
pub struct Bookmark {
    pub id: String,
    pub name: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
    pub tag: Option<BookmarkTag>,
    pub notion_url: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct BookmarkTag {
    pub id: String,
    pub name: String,
    pub color: String,
}

impl From<crate::entity::bookmark::BookmarkEntity> for Bookmark {
    fn from(value: crate::entity::bookmark::BookmarkEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            url: value.url,
            favicon: value.favicon,
            tag: value.tag.map(|tag| BookmarkTag::from(tag)),
            notion_url: value.notion_url,
        }
    }
}

impl From<crate::entity::bookmark::BookmarkTagEntity> for BookmarkTag {
    fn from(value: crate::entity::bookmark::BookmarkTagEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            color: value.color,
        }
    }
}
