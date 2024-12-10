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
    url: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiTag {
    id: String,
    name: String,
    color: AnkiTagColor,
}

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq)]
pub enum AnkiTagColor {
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

#[derive(async_graphql::SimpleObject)]
pub struct AnkiBlock {
    front: serde_json::Value,
    back: serde_json::Value,
    explanation: serde_json::Value,
}
