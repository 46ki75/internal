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

static REQWEST_CLIENT: tokio::sync::OnceCell<reqwest::Client> = tokio::sync::OnceCell::const_new();

pub async fn get_or_init_reqwest_client() -> Result<&'static reqwest::Client, crate::error::Error> {
    REQWEST_CLIENT
        .get_or_try_init(|| async {
            let client = reqwest::Client::new();

            Ok(client)
        })
        .await
}

#[cached::proc_macro::cached]
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
