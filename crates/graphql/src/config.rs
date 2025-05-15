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

        let names: Vec<String> = vec![
            format!("/{stage_name}/46ki75/internal/notion/secret"),
            format!("/{stage_name}/46ki75/internal/notion/anki/database/id"),
            format!("/{stage_name}/46ki75/internal/notion/todo/database/id"),
            format!("/{stage_name}/46ki75/internal/notion/bookmark/database/id"),
        ];

        let values = Self::fetch_ssm_parameters(ssm_client.into(), names).await?;

        let notion_api_key = values[0].to_owned();
        let notion_anki_database_id = values[1].to_owned();
        let notion_to_do_database_id = values[2].to_owned();
        let notion_bookmark_database_id = values[3].to_owned();

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

    async fn fetch_ssm_parameters(
        ssm_client: std::sync::Arc<aws_sdk_ssm::Client>,
        names: Vec<String>,
    ) -> Result<Vec<String>, crate::error::Error> {
        let mut map: std::collections::HashMap<String, String> = std::collections::HashMap::new();

        let parameters = ssm_client
            .get_parameters()
            .with_decryption(true)
            .set_names(Some(names.clone()))
            .send()
            .await
            .map_err(|e| crate::error::Error::SsmFetchParameter(e.to_string()))?
            .parameters
            .ok_or(crate::error::Error::SsmFetchParameter(
                "No parameter found".to_string(),
            ))?;

        for parameter in parameters {
            let key = parameter.name.unwrap();
            let value = parameter
                .value
                .ok_or(crate::error::Error::SsmFetchParameter(format!(
                    "No value found: {}",
                    key
                )))?;
            map.insert(key, value);
        }

        let mut results: Vec<String> = Vec::new();

        for name in names {
            let value = map
                .get(name.as_str())
                .ok_or(crate::error::Error::SsmFetchParameter(format!(
                    "No value found: {}",
                    name
                )))?;
            results.push(value.to_owned());
        }

        Ok(results)
    }
}
