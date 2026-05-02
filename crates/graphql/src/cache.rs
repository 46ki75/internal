use aws_config::BehaviorVersion;

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

/// Fetches the Notion API key from SSM Parameter Store.
pub async fn get_or_init_notion_api_key() -> Result<String, crate::error::Error> {
    let stage_name = get_or_init_stage_name().await?;
    get_parameter(format!("/{stage_name}/46ki75/internal/notion/secret")).await
}

pub async fn get_or_init_notion_anki_data_source_id() -> Result<String, crate::error::Error> {
    let stage_name = get_or_init_stage_name().await?;
    get_parameter(format!(
        "/{stage_name}/46ki75/internal/notion/anki/data_source/id"
    ))
    .await
}

pub async fn get_or_init_notion_to_do_data_source_id() -> Result<String, crate::error::Error> {
    let stage_name = get_or_init_stage_name().await?;
    get_parameter(format!(
        "/{stage_name}/46ki75/internal/notion/todo/data_source/id"
    ))
    .await
}

pub async fn get_or_init_notion_bookmark_data_source_id() -> Result<String, crate::error::Error> {
    let stage_name = get_or_init_stage_name().await?;
    get_parameter(format!(
        "/{stage_name}/46ki75/internal/notion/bookmark/data_source/id"
    ))
    .await
}

pub async fn get_or_init_notion_icon_data_source_id() -> Result<String, crate::error::Error> {
    let stage_name = get_or_init_stage_name().await?;
    get_parameter(format!(
        "/{stage_name}/46ki75/internal/notion/icon/data_source/id"
    ))
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

            let client = notionrs::Client::new(secret.as_str());

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

            let notionrs_client = notionrs::Client::new(secret.as_str());

            let client = notion_to_jarkup::client::Client {
                notionrs_client,
                reqwest_client: reqwest::Client::new(),
                enable_unsupported_block: true,
                enable_fetch_image_meta: false,
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

pub async fn get_or_init_finevoice_api_key() -> Result<String, crate::error::Error> {
    get_parameter("/shared/46ki75/internal/finevoice/secret".to_string()).await
}

#[cached::proc_macro::cached(result = true)]
pub async fn get_parameter(parameter_name: String) -> Result<String, crate::error::Error> {
    let sdk_config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let ssm_client = aws_sdk_ssm::Client::new(&sdk_config);

    let parameter = ssm_client
        .get_parameter()
        .name(&parameter_name)
        .with_decryption(true)
        .send()
        .await?
        .parameter
        .ok_or_else(|| {
            crate::error::Error::SsmParameter(format!("Parameter not found: {}", &parameter_name))
        })?
        .value
        .ok_or_else(|| {
            crate::error::Error::SsmParameter(format!(
                "Parameter value not found: {}",
                &parameter_name
            ))
        })?;

    Ok(parameter)
}
