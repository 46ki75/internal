use serde::{Deserialize, Serialize};
use serde_json::json;

// # --------------------------------------------------------------------------------
//
// serde
//
// # --------------------------------------------------------------------------------

// Date

#[derive(Deserialize, Serialize, Debug)]
pub struct DateProperty {
    start: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Date {
    date: DateProperty,
}

// Number

#[derive(Deserialize, Serialize, Debug)]
pub struct Number {
    number: f64,
}

// MultiSelect

#[derive(Deserialize, Serialize, Debug, Clone, async_graphql::SimpleObject)]
pub struct MultiSelectProperty {
    id: String,
    color: String,
    name: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct MultiSelect {
    multi_select: Vec<MultiSelectProperty>,
}

// properties

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AnkiDatabaseResponseProperties {
    next_review_at: Date,
    ease_factor: Number,
    repetition_count: Number,
    tags: MultiSelect,
}

// Response

#[derive(Deserialize, Serialize, Debug)]
pub struct AnkiDatabaseResponseResult {
    id: String,
    created_time: String,
    last_edited_time: String,
    properties: AnkiDatabaseResponseProperties,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct AnkiDatabaseResponse {
    results: Vec<AnkiDatabaseResponseResult>,
}

// # --------------------------------------------------------------------------------
//
// GraphQL Objects
//
// # --------------------------------------------------------------------------------

pub struct Learn {
    id: String,
    next_review_at: String,
    created_at: String,
    updated_at: String,
    ease_factor: f64,
    repetition_count: u32,
    tags: Vec<MultiSelectProperty>,
}

impl Learn {
    pub async fn new(
        ctx: &async_graphql::Context<'_>,
        notion_api_key: String,
        database_id: String,
    ) -> Result<Self, async_graphql::Error> {
        let client = reqwest::Client::new();

        let request_body = json!({
            "sorts": [
                {
                    "property": "nextReviewAt",
                    "direction": "ascending"
                }
            ],
            "page_size": 1
        });

        let request = client
            .post(format!(
                "https://api.notion.com/v1/databases/{}/query",
                database_id
            ))
            .header("Notion-Version", "2022-06-28")
            .header("Authorization", format!("Bearer {}", notion_api_key))
            .json(&request_body);

        let response = request
            .send()
            .await
            .map_err(|_| {
                async_graphql::Error::new("An error occurred in the Notion Anki database query.")
            })?
            .text()
            .await?;

        let query_results = serde_json::from_str::<AnkiDatabaseResponse>(&response)?;

        let query_result = query_results
            .results
            .first()
            .ok_or(async_graphql::Error::new(
                "Failed to retrieve the card from the Anki database.",
            ))?;

        let id = query_result.id.clone();
        let next_review_at = query_result.properties.next_review_at.date.start.clone();
        let created_at = query_result.created_time.clone();
        let updated_at = query_result.last_edited_time.clone();
        let ease_factor = query_result.properties.ease_factor.number;
        let repetition_count = query_result.properties.repetition_count.number;
        let tags = query_result.properties.tags.multi_select.clone();

        Ok(Learn {
            id,
            next_review_at,
            created_at,
            updated_at,
            ease_factor,
            repetition_count: repetition_count as u32,
            tags,
        })
    }
}

#[async_graphql::Object]
impl Learn {
    pub async fn id(&self) -> String {
        self.id.to_string()
    }

    pub async fn next_review_at(&self) -> String {
        self.next_review_at.to_string()
    }

    pub async fn created_at(&self) -> String {
        self.created_at.to_string()
    }

    pub async fn updated_at(&self) -> String {
        self.updated_at.to_string()
    }

    pub async fn ease_factor(&self) -> f64 {
        self.ease_factor
    }

    pub async fn repetition_count(&self) -> u32 {
        self.repetition_count
    }

    pub async fn tags(&self) -> Vec<MultiSelectProperty> {
        self.tags.clone()
    }
}
