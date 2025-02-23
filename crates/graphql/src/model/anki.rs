#[derive(async_graphql::SimpleObject)]
pub struct AnkiConnection {
    pub edges: Vec<AnkiEdge>,
    pub page_info: crate::model::PageInfo,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiEdge {
    pub node: Anki,
    pub cursor: String,
}

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
