async fn try_get_ssm_parameter_async(
    ssm_client: aws_sdk_ssm::Client,
    parameter_name: &str,
) -> Result<String, crate::error::Error> {
    let parameter = ssm_client
        .get_parameter()
        .name(parameter_name)
        .with_decryption(true)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to get parameter: {}", e);
            crate::error::Error::SsmParameter(e.to_string())
        })?
        .parameter
        .ok_or_else(|| {
            tracing::error!("Parameter not found: {}", parameter_name);
            crate::error::Error::SsmParameter(format!("Parameter not found: {}", parameter_name))
        })?
        .value
        .ok_or_else(|| {
            tracing::error!("Parameter value not found: {}", parameter_name);
            crate::error::Error::SsmParameter(format!(
                "Parameter value not found: {}",
                parameter_name
            ))
        })?;

    tracing::debug!("Fetching SSM Parameter: {}", parameter_name);

    Ok(parameter)
}

static STAGE_NAME: tokio::sync::OnceCell<String> = tokio::sync::OnceCell::const_new();

/// Fetches the STAGE_NAME from cache or initializes it from environment variables if not already loaded.
pub async fn get_or_init_stage_name() -> Result<&'static String, crate::error::Error> {
    STAGE_NAME
        .get_or_try_init(|| async {
            let stage_name = std::env::var("STAGE_NAME").unwrap();

            tracing::debug!("STAGE_NAME: {}", stage_name);

            Ok(stage_name)
        })
        .await
}

static AWS_SDK_CONFIG: tokio::sync::OnceCell<aws_config::SdkConfig> =
    tokio::sync::OnceCell::const_new();

/// Initialises or gets AWS SDK Config.
pub async fn get_or_init_aws_sdk_config() -> &'static aws_config::SdkConfig {
    AWS_SDK_CONFIG
        .get_or_init(|| async {
            aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await
        })
        .await
}

static SSM_CLIENT: tokio::sync::OnceCell<aws_sdk_ssm::Client> = tokio::sync::OnceCell::const_new();

/// Initialises or gets AWS Systems Manager SDK Client.
pub async fn get_or_init_ssm_client() -> &'static aws_sdk_ssm::Client {
    SSM_CLIENT
        .get_or_init(|| async { aws_sdk_ssm::Client::new(get_or_init_aws_sdk_config().await) })
        .await
}

static DYNAMODB_CLIENT: tokio::sync::OnceCell<aws_sdk_dynamodb::Client> =
    tokio::sync::OnceCell::const_new();

pub async fn get_or_init_dynamodb_client() -> &'static aws_sdk_dynamodb::Client {
    DYNAMODB_CLIENT
        .get_or_init(|| async { aws_sdk_dynamodb::Client::new(get_or_init_aws_sdk_config().await) })
        .await
}

static COGNITO_IDP_CLIENT: tokio::sync::OnceCell<aws_sdk_cognitoidentityprovider::Client> =
    tokio::sync::OnceCell::const_new();

pub async fn get_or_init_cognito_idp() -> &'static aws_sdk_cognitoidentityprovider::Client {
    COGNITO_IDP_CLIENT
        .get_or_init(|| async {
            aws_sdk_cognitoidentityprovider::Client::new(get_or_init_aws_sdk_config().await)
        })
        .await
}

static NOTION_API_KEY: tokio::sync::OnceCell<String> = tokio::sync::OnceCell::const_new();

/// Fetches the Notion API key from cache or initializes it if not already loaded.
pub async fn get_or_init_notion_api_key() -> Result<&'static String, crate::error::Error> {
    NOTION_API_KEY
        .get_or_try_init(|| async {
            let stage_name = get_or_init_stage_name().await?;
            let notion_api_key = try_get_ssm_parameter_async(
                get_or_init_ssm_client().await.clone(),
                format!("/{stage_name}/46ki75/internal/notion/secret").as_str(),
            )
            .await?;

            Ok(notion_api_key)
        })
        .await
}

static NOTION_ANKI_DATABASE_ID: tokio::sync::OnceCell<String> = tokio::sync::OnceCell::const_new();

pub async fn get_or_init_notion_anki_database_id() -> Result<&'static String, crate::error::Error> {
    NOTION_ANKI_DATABASE_ID
        .get_or_try_init(|| async {
            let stage_name = get_or_init_stage_name().await?;
            let id = try_get_ssm_parameter_async(
                get_or_init_ssm_client().await.clone(),
                format!("/{stage_name}/46ki75/internal/notion/anki/database/id").as_str(),
            )
            .await?;

            Ok(id)
        })
        .await
}

static NOTION_TO_DO_DATABASE_ID: tokio::sync::OnceCell<String> = tokio::sync::OnceCell::const_new();

pub async fn get_or_init_notion_to_do_database_id() -> Result<&'static String, crate::error::Error>
{
    NOTION_TO_DO_DATABASE_ID
        .get_or_try_init(|| async {
            let stage_name = get_or_init_stage_name().await?;
            let id = try_get_ssm_parameter_async(
                get_or_init_ssm_client().await.clone(),
                format!("/{stage_name}/46ki75/internal/notion/todo/database/id").as_str(),
            )
            .await?;

            Ok(id)
        })
        .await
}

static NOTION_BOOKMARK_DATABASE_ID: tokio::sync::OnceCell<String> =
    tokio::sync::OnceCell::const_new();

pub async fn get_or_init_notion_bookmark_database_id()
-> Result<&'static String, crate::error::Error> {
    NOTION_BOOKMARK_DATABASE_ID
        .get_or_try_init(|| async {
            let stage_name = get_or_init_stage_name().await?;
            let id = try_get_ssm_parameter_async(
                get_or_init_ssm_client().await.clone(),
                format!("/{stage_name}/46ki75/internal/notion/bookmark/database/id").as_str(),
            )
            .await?;

            Ok(id)
        })
        .await
}

static NOTIONRS_CLIENT: tokio::sync::OnceCell<notionrs::Client> =
    tokio::sync::OnceCell::const_new();

/// Fetches the NotionRs Client from cache or initializes it if not already loaded.
pub async fn get_or_init_notionrs_client() -> Result<&'static notionrs::Client, crate::error::Error>
{
    NOTIONRS_CLIENT
        .get_or_try_init(|| async {
            let secret = get_or_init_notion_api_key().await?;

            let client = notionrs::Client::new().secret(secret.as_str());

            Ok(client)
        })
        .await
}

static NOTION_TO_JARKUP_CLIENT: tokio::sync::OnceCell<notion_to_jarkup::client::Client> =
    tokio::sync::OnceCell::const_new();

/// Fetches the NotionRs Client from cache or initializes it if not already loaded.
pub async fn get_or_init_notion_to_jarkup_client()
-> Result<&'static notion_to_jarkup::client::Client, crate::error::Error> {
    NOTION_TO_JARKUP_CLIENT
        .get_or_try_init(|| async {
            let secret = get_or_init_notion_api_key().await?;

            let notionrs_client = notionrs::Client::new().secret(secret.as_str());

            let client = notion_to_jarkup::client::Client {
                notionrs_client,
                reqwest_client: reqwest::Client::new(),
                enable_unsupported_block: true,
            };

            Ok(client)
        })
        .await
}

static REQWEST_CLIENT: tokio::sync::OnceCell<reqwest::Client> = tokio::sync::OnceCell::const_new();

pub async fn get_or_init_reqwest_client() -> Result<&'static reqwest::Client, crate::error::Error> {
    REQWEST_CLIENT
        .get_or_try_init(|| async {
            let client = reqwest::Client::new();

            Ok(client)
        })
        .await
}
