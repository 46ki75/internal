pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject)]
pub struct Anki {
    id: String,
    title: Option<String>,
    description: Option<String>,
    ease_factor: f64,
    repetition_count: u32,
    next_review_at: String,
    created_at: String,
    updated_at: String,
    tags: Vec<AnkiTag>,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiTag {
    id: String,
    name: String,
    color: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiBlock {
    front: serde_json::Value,
    back: serde_json::Value,
    explanation: serde_json::Value,
}
