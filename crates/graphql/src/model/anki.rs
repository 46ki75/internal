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

    pub async fn block_list(&self) -> Result<AnkiBlock, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let mut client = elmethis_notion::client::Client::new(secret);

        let blocks = client
            .convert_block(&self.page_id)
            .await
            .map_err(|e| async_graphql::Error::from(format!("Failed to get block: {}", e)))?;

        let mut front: Vec<elmethis_notion::block::Block> = Vec::new();
        let mut back: Vec<elmethis_notion::block::Block> = Vec::new();
        let mut explanation: Vec<elmethis_notion::block::Block> = Vec::new();

        enum Marker {
            Front,
            Back,
            Explanation,
        }

        let mut marker = Marker::Front;

        for block in blocks {
            if let elmethis_notion::block::Block::ElmHeading1(
                elmethis_notion::block::ElmHeading1 { props },
            ) = &block
            {
                if props.text == "front" {
                    marker = Marker::Front;
                    continue;
                } else if props.text == "back" {
                    marker = Marker::Back;
                    continue;
                } else if props.text == "explanation" {
                    marker = Marker::Explanation;
                    continue;
                }
            }

            match marker {
                Marker::Front => front.push(block),
                Marker::Back => back.push(block),
                Marker::Explanation => explanation.push(block),
            }
        }

        Ok(AnkiBlock {
            front: serde_json::to_value(front)?,
            back: serde_json::to_value(back)?,
            explanation: serde_json::to_value(explanation)?,
        })
    }
}
