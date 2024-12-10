pub struct Anki {
    secret: String,
    database_id: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiMeta {
    id: String,
    title: Option<String>,
    description: Option<String>,
    ease_factor: f64,
    repetition_count: u32,
    next_review_at: String,
    created_at: String,
    updated_at: String,
}

#[derive(async_graphql::SimpleObject)]
pub struct AnkiBlock {
    front: serde_json::Value,
    back: serde_json::Value,
    explanation: serde_json::Value,
}

impl Anki {
    pub fn new(_: &async_graphql::Context) -> Result<Self, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_ANKI_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_ANKI_DATABASE_ID not found"))?;

        Ok(Anki {
            secret,
            database_id,
        })
    }
}

#[async_graphql::Object]
impl Anki {
    pub async fn list_anki(&self) -> Result<Vec<AnkiMeta>, async_graphql::Error> {
        let client = notionrs::client::Client::new().secret(&self.secret);

        let sorts = vec![notionrs::database::Sort::asc("nextReviewAt")];

        let request = client
            .query_database()
            .database_id(&self.database_id)
            .sorts(sorts)
            .page_size(50);

        let response = request.send().await?;

        let pages = response.results;

        let anki_meta = pages
            .iter()
            .map(|page| {
                let properties = &page.properties;

                // >>> title
                let title_property = properties
                    .get("title")
                    .ok_or(async_graphql::Error::from("title not found"))?;

                let title = match title_property {
                    notionrs::page::PageProperty::Title(title) => {
                        if title.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(title.to_string().trim().to_string())
                        }
                    }
                    _ => return Err(async_graphql::Error::from("title not found")),
                };
                // <<< title

                // >>> description
                let description_property = properties
                    .get("description")
                    .ok_or(async_graphql::Error::from("description not found"))?;

                let description = match description_property {
                    notionrs::page::PageProperty::RichText(description) => {
                        if description.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(description.to_string().trim().to_string())
                        }
                    }
                    _ => return Err(async_graphql::Error::from("description not found")),
                };
                // <<< description

                // >>> ease_factor
                let ease_factor_property = properties
                    .get("easeFactor")
                    .ok_or(async_graphql::Error::from("easeFactor not found"))?;

                let ease_factor = match ease_factor_property {
                    notionrs::page::PageProperty::Number(ease_factor) => ease_factor
                        .number
                        .ok_or(async_graphql::Error::from("easeFactor not found"))?,
                    _ => return Err(async_graphql::Error::from("easeFactor not found")),
                };
                // <<< ease_factor

                // >>> repetition_count
                let repetition_count_property = properties
                    .get("repetitionCount")
                    .ok_or(async_graphql::Error::from("repetitionCount not found"))?;

                let repetition_count = match repetition_count_property {
                    notionrs::page::PageProperty::Number(repetition_count) => repetition_count
                        .number
                        .ok_or(async_graphql::Error::from("repetitionCount not found"))?
                        as u32,
                    _ => return Err(async_graphql::Error::from("repetitionCount not found")),
                };
                // <<< repetition_count

                // >>> next_review_at
                let next_review_at_property = &properties
                    .get("nextReviewAt")
                    .ok_or(async_graphql::Error::from("nextReviewAt not found"))?;

                let next_review_at = match next_review_at_property {
                    notionrs::page::PageProperty::Date(next_review_at) => next_review_at
                        .clone()
                        .date
                        .ok_or(async_graphql::Error::from("nextReviewAt not found"))?
                        .start
                        .ok_or(async_graphql::Error::from("nextReviewAt not found"))?
                        .to_rfc3339(),
                    _ => return Err(async_graphql::Error::from("nextReviewAt not found")),
                };
                // <<< next_review_at

                let id = page.id.to_string();
                let created_at = page.created_time.to_rfc3339();
                let updated_at = page.last_edited_time.to_rfc3339();

                Ok(AnkiMeta {
                    id,
                    title,
                    description,
                    ease_factor,
                    repetition_count,
                    next_review_at,
                    created_at,
                    updated_at,
                })
            })
            .collect::<Result<Vec<AnkiMeta>, async_graphql::Error>>()?;

        Ok(anki_meta)
    }

    pub async fn get_anki_block(&self, page_id: String) -> Result<AnkiBlock, async_graphql::Error> {
        let mut client = elmethis_notion::client::Client::new(&self.secret);

        let blocks = client
            .convert_block(&page_id)
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
