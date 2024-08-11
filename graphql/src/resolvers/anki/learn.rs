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

#[derive(async_graphql::SimpleObject, Deserialize, Serialize, Debug, Clone)]
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

#[derive(async_graphql::SimpleObject, Deserialize, Serialize, Debug, Clone)]
pub struct Blocks {
    front: serde_json::Value,
    back: serde_json::Value,
    explanation: serde_json::Value,
}

pub struct Learn {
    page_id: String,
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
        // # --------------------------------------------------------------------------------
        //
        // Query Database
        //
        // # --------------------------------------------------------------------------------

        let reqwest_client = reqwest::Client::new();

        let request_body = json!({
            "sorts": [
                {
                    "property": "nextReviewAt",
                    "direction": "ascending"
                }
            ],
            "page_size": 1
        });

        let request = reqwest_client
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
            page_id: id,
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
    /// ページID
    pub async fn page_id(&self) -> String {
        self.page_id.to_string()
    }

    /// 学習すべき日時
    pub async fn next_review_at(&self) -> String {
        self.next_review_at.to_string()
    }

    /// 作成日
    pub async fn created_at(&self) -> String {
        self.created_at.to_string()
    }

    /// 最終更新日
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

    /// Lambda 関数を呼び出してブロックを取得するクエリ
    /// すべてのブロックは一度に取得されるため、フィールドを制限してもパフォーマンスは変わらない。
    pub async fn blocks(&self) -> Result<Blocks, async_graphql::Error> {
        let region = aws_config::Region::from_static("ap-northeast-1");
        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region)
            .load()
            .await;

        let lambda_client = aws_sdk_lambda::Client::new(&config);

        let payload = json!({
            "block_id": self.page_id
        })
        .to_string();

        let lambda_request = lambda_client
            .invoke()
            .function_name("notion-convert-block")
            .payload(aws_sdk_lambda::primitives::Blob::new(payload.into_bytes()));

        let lambda_response = lambda_request.send().await?;

        let lambda_payload = String::from_utf8(lambda_response.payload.unwrap().as_ref().to_vec())?;

        let blocks = serde_json::from_str::<Blocks>(&lambda_payload)?;

        Ok(blocks)
    }
}
