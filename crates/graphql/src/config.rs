#[derive(Debug)]
pub struct Config {
    pub stage_name: String,
    pub notion_api_key: String,
    pub notion_anki_database_id: String,
    pub notion_to_do_database_id: String,
    pub notion_bookmark_database_id: String,

    pub notion_client: std::sync::Arc<notionrs::client::Client>,
    pub notion_to_jarkup_client: std::sync::Arc<notion_to_jarkup::client::Client>,

    pub dynamodb_client: std::sync::Arc<aws_sdk_dynamodb::Client>,
}

impl Config {
    pub async fn try_new_async() -> Result<Self, crate::error::Error> {
        let stage_name = std::env::var("STAGE_NAME").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound("STAGE_NAME".to_string())
        })?;

        tracing::info!("STAGE_NAME: {}", stage_name);

        let aws_sdk_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let dynamodb_client = std::sync::Arc::new(aws_sdk_dynamodb::Client::new(&aws_sdk_config));

        let ssm_client = std::sync::Arc::new(aws_sdk_ssm::Client::new(&aws_sdk_config));

        let notion_api_key_future = ssm_client
            .get_parameter()
            .name(format!("/{stage_name}/46ki75/internal/notion/secret"))
            .with_decryption(true)
            .send();

        let notion_anki_database_id = ssm_client
            .get_parameter()
            .name("/shared/46ki75/internal/notion/anki/database/id")
            .with_decryption(true)
            .send();

        let notion_to_do_database_id = ssm_client
            .get_parameter()
            .name("/shared/46ki75/internal/notion/todo/database/id")
            .with_decryption(true)
            .send();

        let notion_bookmark_database_id = ssm_client
            .get_parameter()
            .name("/shared/46ki75/internal/notion/bookmark/database/id")
            .with_decryption(true)
            .send();

        let (
            notion_api_key_response,
            notion_anki_response,
            notion_to_do_response,
            notion_bookmark_response,
        ) = tokio::join!(
            notion_api_key_future,
            notion_anki_database_id,
            notion_to_do_database_id,
            notion_bookmark_database_id
        );

        let notion_api_key = notion_api_key_response
            .map_err(|e| crate::error::Error::SsmFetchParameter(e.to_string()))?
            .parameter
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No parameter found".to_string(),
            ))?
            .value
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No value found".to_string(),
            ))?;

        let notion_anki_database_id = notion_anki_response
            .map_err(|e| crate::error::Error::SsmFetchParameter(e.to_string()))?
            .parameter
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No parameter found".to_string(),
            ))?
            .value
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No value found".to_string(),
            ))?;

        let notion_to_do_database_id = notion_to_do_response
            .map_err(|e| crate::error::Error::SsmFetchParameter(e.to_string()))?
            .parameter
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No parameter found".to_string(),
            ))?
            .value
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No value found".to_string(),
            ))?;

        let notion_bookmark_database_id = notion_bookmark_response
            .map_err(|e| crate::error::Error::SsmFetchParameter(e.to_string()))?
            .parameter
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No parameter found".to_string(),
            ))?
            .value
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No value found".to_string(),
            ))?;

        let notion_client =
            std::sync::Arc::new(notionrs::client::Client::new().secret(&notion_api_key));

        let notion_to_jarkup_client = std::sync::Arc::new(notion_to_jarkup::client::Client {
            notionrs_client: notionrs::client::Client::new().secret(&notion_api_key),
            reqwest_client: reqwest::Client::new(),
            enable_unsupported_block: true,
        });

        Ok(Config {
            stage_name,
            notion_api_key,
            notion_anki_database_id,
            notion_to_do_database_id,
            notion_bookmark_database_id,
            notion_client,
            notion_to_jarkup_client,
            dynamodb_client,
        })
    }
}
