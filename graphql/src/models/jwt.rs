use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// URL of the authentication service that issued the JWT
    pub iss: String,
    /// Associated user ID
    pub sub: String,
    /// URL of the service receiving the JWT
    pub aud: String,
    /// Timestamp when the token expires
    pub exp: i64,
    /// Timestamp when the token becomes valid
    pub nbf: i64,
    /// Timestamp when the token was issued
    pub iat: i64,
    /// Identifier of the token
    pub jti: String,
}

pub struct Jwt {
    pub value: String,
}

impl Jwt {
    async fn generate_token(
        config: &aws_config::SdkConfig,
        key_name: String,
    ) -> Result<Self, async_graphql::Error> {
        let client = aws_sdk_dynamodb::Client::new(config);

        let request = client
            .query()
            .table_name("jwt-keystore")
            .key_condition_expression("#PK = :PK")
            .expression_attribute_names("#PK", "PK")
            .expression_attribute_values(
                ":PK",
                aws_sdk_dynamodb::types::AttributeValue::S(format!("{}#", key_name)),
            )
            .limit(1);

        let response = request.send().await.map_err(|_| {
            async_graphql::ServerError::new(
                "An error occurred while retrieving the JWT secret key.",
                None,
            )
        })?;

        let items = response
            .items
            .ok_or_else(|| async_graphql::ServerError::new("message", None))?;

        let item = items.first().ok_or(async_graphql::ServerError::new(
            "The JWT secret key is missing. Please check if the key is being regularly issued.",
            None,
        ))?;

        let jwt_secret = item.get("secret").ok_or(async_graphql::ServerError::new(
            "The `secret` field in the JWT secret key record cannot be found. The record might be incorrect.",
            None,
        ))?.as_s().map_err(|_|{
            async_graphql::ServerError::new(
            "The type of the `secret` field in the JWT secret key record is something other than String.",
            None,
        )
        })?;

        let jwt_secret_kid = item.get("SK").ok_or(async_graphql::ServerError::new(
            "The `SK` field in the JWT secret key record cannot be found. The record might be incorrect.",
            None,
        ))?.as_s().map_err(|_|{
            async_graphql::ServerError::new(
            "The type of the `SK` field in the JWT secret key record is something other than String.",
            None,
        )
        })?;

        let utc_now = chrono::Utc::now();
        let expire_at = utc_now
            + if key_name == "JWT_REFRESH_SECRET" {
                chrono::Duration::days(7)
            } else {
                chrono::Duration::minutes(10)
            };

        let claims = Claims {
            iss: String::from("https://internal.46ki75.com"),
            sub: String::from("ID"),
            aud: String::from("https://internal.46ki75.com"),
            exp: expire_at.timestamp(),
            nbf: utc_now.timestamp(),
            iat: utc_now.timestamp(),
            jti: uuid::Uuid::new_v4().to_string(),
        };

        let header = jsonwebtoken::Header {
            kid: Some(jwt_secret_kid.clone()),
            ..Default::default()
        };

        let token = jsonwebtoken::encode(
            &header,
            &claims,
            &jsonwebtoken::EncodingKey::from_secret(jwt_secret.as_ref()),
        )
        .map_err(|_| async_graphql::ServerError::new("Failed to encode the JWT.", None))?;

        Ok(Jwt { value: token })
    }

    pub async fn generate_access_token(
        config: &aws_config::SdkConfig,
    ) -> Result<Self, async_graphql::Error> {
        Self::generate_token(config, "JWT_ACCESS_SECRET".to_string()).await
    }

    pub async fn generate_refresh_token(
        config: &aws_config::SdkConfig,
    ) -> Result<Self, async_graphql::Error> {
        Self::generate_token(config, "JWT_REFRESH_SECRET".to_string()).await
    }
}
