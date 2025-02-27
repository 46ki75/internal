#[derive(Debug)]
pub struct Config {
    pub environment: String,
    pub notion_api_key: String,
    pub notion_anki_database_id: String,
    pub notion_to_do_database_id: String,
    pub notion_bookmark_database_id: String,

    pub notion_client: std::sync::Arc<notionrs::client::Client>,
    pub elmethis_notion_client: std::sync::Arc<elmethis_notion::client::Client>,

    pub dynamodb_client: std::sync::Arc<aws_sdk_dynamodb::Client>,
}

impl Config {
    pub async fn try_new_async() -> Result<Self, crate::error::Error> {
        let environment = std::env::var("ENVIRONMENT").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound("ENVIRONMENT".to_string())
        })?;

        dotenvy::dotenv().ok();

        let notion_api_key = std::env::var("NOTION_API_KEY").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound("NOTION_API_KEY".to_string())
        })?;

        let notion_anki_database_id = std::env::var("NOTION_ANKI_DATABASE_ID").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound(
                "NOTION_ANKI_DATABASE_ID".to_string(),
            )
        })?;

        let notion_to_do_database_id = std::env::var("NOTION_TO_DO_DATABASE_ID").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound(
                "NOTION_TO_DO_DATABASE_ID".to_string(),
            )
        })?;

        let notion_bookmark_database_id =
            std::env::var("NOTION_BOOKMARK_DATABASE_ID").map_err(|_| {
                crate::error::Error::EnvironmentalVariableNotFound(
                    "NOTION_BOOKMARK_DATABASE_ID".to_string(),
                )
            })?;

        let notion_client =
            std::sync::Arc::new(notionrs::client::Client::new().secret(&notion_api_key));

        let elmethis_notion_client =
            std::sync::Arc::new(elmethis_notion::client::Client::new(&notion_api_key));

        let aws_sdk_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let dynamodb_client = std::sync::Arc::new(aws_sdk_dynamodb::Client::new(&aws_sdk_config));

        Ok(Config {
            environment,
            notion_api_key,
            notion_anki_database_id,
            notion_to_do_database_id,
            notion_bookmark_database_id,
            notion_client,
            elmethis_notion_client,
            dynamodb_client,
        })
    }
}
