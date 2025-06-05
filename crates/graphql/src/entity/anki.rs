pub struct AnkiEntity {
    pub page_id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub ease_factor: f64,
    pub repetition_count: u32,
    pub next_review_at: String,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<AnkiTagEntity>,
    pub url: String,
}

pub struct AnkiTagEntity {
    pub id: String,
    pub name: String,
    pub color: String,
}

pub struct AnkiBlockEntity {
    pub front: serde_json::Value,
    pub back: serde_json::Value,
    pub explanation: serde_json::Value,
}
