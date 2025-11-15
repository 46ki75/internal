pub mod mutation;
pub mod query;
use super::entity::*;

#[derive(async_graphql::SimpleObject)]
pub struct AnkiConnection {
    pub edges: Vec<AnkiEdge>,
    pub page_info: crate::resolver::PageInfo,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiEdge {
    pub node: Anki,
    pub cursor: String,
}

#[derive(async_graphql::SimpleObject)]
#[graphql(complex)]
pub struct Anki {
    pub page_id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub ease_factor: f64,
    pub repetition_count: u32,
    pub next_review_at: String,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<AnkiTag>,
    pub url: String,
    pub is_review_required: bool,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiTag {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiBlock {
    pub front: serde_json::Value,
    pub back: serde_json::Value,
    pub explanation: serde_json::Value,
}

impl From<AnkiEntity> for Anki {
    fn from(value: AnkiEntity) -> Self {
        Self {
            page_id: value.page_id,
            title: value.title,
            description: value.description,
            ease_factor: value.ease_factor,
            repetition_count: value.repetition_count,
            next_review_at: value.next_review_at,
            created_at: value.created_at,
            updated_at: value.updated_at,
            tags: value
                .tags
                .into_iter()
                .map(|tag| AnkiTag::from(tag))
                .collect(),
            url: value.url,
            is_review_required: value.is_review_required,
        }
    }
}

impl From<AnkiTagEntity> for AnkiTag {
    fn from(value: AnkiTagEntity) -> Self {
        Self {
            id: value.id,
            name: value.name,
            color: value.color,
        }
    }
}

impl From<AnkiBlockEntity> for AnkiBlock {
    fn from(value: AnkiBlockEntity) -> Self {
        Self {
            front: value.front,
            back: value.back,
            explanation: value.explanation,
        }
    }
}
