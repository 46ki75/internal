use serde::Serialize;

use super::entity::*;

#[derive(Debug, Default, utoipa::ToSchema, Serialize)]
pub struct BookmarkResponse {
    pub id: String,
    pub name: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
    pub tag: Option<BookmarkTagReponse>,
    pub nsfw: bool,
    pub favorite: bool,
    pub notion_url: String,
}

#[derive(utoipa::ToSchema, Serialize, Debug, Default)]
pub struct BookmarkTagReponse {
    pub id: String,
    pub name: String,
    pub color: String,
}

impl From<BookmarkEntity> for BookmarkResponse {
    fn from(value: BookmarkEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            url: value.url,
            favicon: value.favicon,
            tag: value.tag.map(BookmarkTagReponse::from),
            nsfw: value.nsfw,
            favorite: value.favorite,
            notion_url: value.notion_url,
        }
    }
}

impl From<BookmarkTagEntity> for BookmarkTagReponse {
    fn from(value: BookmarkTagEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            color: value.color,
        }
    }
}
