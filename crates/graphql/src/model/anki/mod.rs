pub mod mutation;
pub mod query;

pub struct Anki {
    page_id: String,
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
