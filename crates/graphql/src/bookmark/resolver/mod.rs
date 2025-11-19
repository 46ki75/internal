pub mod mutation;
pub mod query;

use super::entity::*;

#[derive(async_graphql::SimpleObject, Debug, Default)]
pub struct Bookmark {
    pub id: String,
    pub name: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
    pub tag: Option<BookmarkTag>,
    pub nsfw: bool,
    pub favorite: bool,
    pub notion_url: String,
}

#[derive(async_graphql::SimpleObject, Debug, Default)]
pub struct BookmarkTag {
    pub id: String,
    pub name: String,
    pub color: String,
}

impl From<BookmarkEntity> for Bookmark {
    fn from(value: BookmarkEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            url: value.url,
            favicon: value.favicon,
            tag: value.tag.map(|tag| BookmarkTag::from(tag)),
            nsfw: value.nsfw,
            favorite: value.favorite,
            notion_url: value.notion_url,
        }
    }
}

impl From<BookmarkTagEntity> for BookmarkTag {
    fn from(value: BookmarkTagEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            color: value.color,
        }
    }
}
