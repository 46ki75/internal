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

#[async_graphql::Object]
impl Anki {
    async fn page_id(&self) -> &str {
        &self.page_id
    }

    async fn title(&self) -> Option<&str> {
        self.title.as_deref()
    }

    async fn description(&self) -> Option<&str> {
        self.description.as_deref()
    }

    async fn ease_factor(&self) -> f64 {
        self.ease_factor
    }

    async fn repetition_count(&self) -> u32 {
        self.repetition_count
    }

    async fn next_review_at(&self) -> &str {
        &self.next_review_at
    }

    async fn created_at(&self) -> &str {
        &self.created_at
    }

    async fn updated_at(&self) -> &str {
        &self.updated_at
    }

    async fn tags(&self) -> &[AnkiTag] {
        &self.tags
    }

    async fn url(&self) -> &str {
        &self.url
    }

    pub async fn block_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<AnkiBlock, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let blocks = anki_service
            .list_blocks(&self.page_id)
            .await
            .map_err(|e| e.to_string())?;

        Ok(blocks)
    }
}
