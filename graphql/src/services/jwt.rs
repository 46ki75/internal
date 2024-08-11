use async_graphql::ErrorExtensions;
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
    /// - `config`: AWS SDK のコンフィグ
    /// - `key_name`: キーの名前。`JWT_REFRESH_TOKEN` or `JWT_ACCESS_TOKEN`
    /// - `domain`: ドメイン名
    /// - `username`: ユーザ名
    /// - `minutes`: 有効期限 \[分\]
    pub async fn generate_token(
        config: &aws_config::SdkConfig,
        key_name: String,
        domain: String,
        username: String,
        minutes: u32,
    ) -> Result<Self, async_graphql::Error> {
        let client = aws_sdk_dynamodb::Client::new(config);

        let request = client
            .query()
            .table_name("jwt-keystore")
            .key_condition_expression("#PK = :PK")
            .expression_attribute_names("#PK", "PK")
            .expression_attribute_values(
                ":PK",
                aws_sdk_dynamodb::types::AttributeValue::S(key_name),
            )
            .limit(1);

        let response = request.send().await.map_err(|_| {
            async_graphql::ServerError::new(
                "An error occurred while retrieving the JWT secret key.",
                None,
            )
            .extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_001")
            })
        })?;

        let items = response
            .items
            .ok_or_else(|| async_graphql::ServerError::new("message", None))?;

        let item = items.first().ok_or(
            async_graphql::ServerError::new(
                "The JWT secret key is missing. Please check if the key is being regularly issued.",
                None,
            )
            .extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_003")
            }),
        )?;

        let jwt_secret = item.get("secret").ok_or(async_graphql::ServerError::new(
            "The `secret` field in the JWT secret key record cannot be found. The record might be incorrect.",
            None,
        ).extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_004")
            }))?.as_s().map_err(|_|{
            async_graphql::ServerError::new(
            "The type of the `secret` field in the JWT secret key record is something other than String.",
            None,
        ).extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_005")
            })
        })?;

        let jwt_secret_kid = item.get("SK").ok_or(async_graphql::ServerError::new(
            "The `SK` field in the JWT secret key record cannot be found. The record might be incorrect.",
            None,
        ).extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_006")
            }))?.as_s().map_err(|_|{
            async_graphql::ServerError::new(
            "The type of the `SK` field in the JWT secret key record is something other than String.",
            None,
        ).extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_007")
            })
        })?;

        let utc_now = chrono::Utc::now();
        let expire_at = utc_now + chrono::Duration::minutes(minutes.into());

        let claims = Claims {
            iss: domain.clone(),
            sub: username,
            aud: domain,
            exp: expire_at.timestamp(),
            nbf: utc_now.timestamp(),
            iat: utc_now.timestamp(),
            jti: uuid::Uuid::new_v4().to_string(),
        };

        let header = jsonwebtoken::Header {
            kid: Some(jwt_secret_kid.clone()),
            alg: jsonwebtoken::Algorithm::HS256,
            ..Default::default()
        };

        let token = jsonwebtoken::encode(
            &header,
            &claims,
            &jsonwebtoken::EncodingKey::from_secret(jwt_secret.as_ref()),
        )
        .map_err(|_| {
            async_graphql::ServerError::new("Failed to encode the JWT.", None)
                .extend_with(|_, e| e.set("code", "AUTH_500_008"))
        })?;

        Ok(Jwt { value: token })
    }

    /// クッキー文字列からJWTを検証する。
    ///
    /// 生のクッキー文字列を受け取り、クッキーをパースする。
    /// パース語に指定キーののJWTを検証する。
    /// 失敗した場合はエラーを伝播し、成功した場合はJWTのデコード内容を返す。
    ///
    /// - `raw_cookie`: 生のクッキー文字列。;デリミタで複数クッキーが含まれていてもよい。
    /// - `key`: 検証するJWTの名前。クッキーのキー名。 `JWT_REFRESH_TOKEN` or `JWT_ACCESS_TOKEN`
    pub async fn validateand_decode_token(
        raw_cookie: String,
        key: String,
    ) -> Result<jsonwebtoken::TokenData<Claims>, async_graphql::Error> {
        let raw_cookies = raw_cookie.split(';');

        let mut refresh_token = String::new();

        for cookie_string in raw_cookies {
            let cookie = cookie::Cookie::parse(cookie_string).unwrap();
            if cookie.name() == key {
                refresh_token = cookie.value().to_string()
            }
        }

        if refresh_token.is_empty() {
            return Err(async_graphql::FieldError::new(format!(
                "The `{}` cookie is missing.",
                key
            ))
            .extend_with(|_, e| e.set("code", "AUTH_401_004")));
        }

        let header = jsonwebtoken::decode_header(&refresh_token).map_err(|_| {
            async_graphql::FieldError::new(
                "The JWT header does not contain KID information. The token is invalid.",
            )
            .extend_with(|_, e| e.set("code", "AUTH_401_005"))
        })?;

        let kid = header.kid.ok_or(
            async_graphql::FieldError::new(
                "The JWT header does not contain KID information. The token is invalid.",
            )
            .extend_with(|_, e| e.set("code", "AUTH_401_005")),
        )?;

        // KID に対応する JWT 秘密鍵を取得

        let region = aws_config::Region::from_static("ap-northeast-1");
        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region)
            .load()
            .await;

        let client = aws_sdk_dynamodb::Client::new(&config);

        let request = client
            .get_item()
            .table_name("jwt-keystore")
            .key("PK", aws_sdk_dynamodb::types::AttributeValue::S(key))
            .key(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S(kid.to_string()),
            );

        let response = request.send().await.map_err(|_| {
            async_graphql::ServerError::new(
                "An error occurred while executing the database query to retrieve the secret key for JWT validation.",
                None,
            )
            .extend_with(|_, e| e.set("code", "AUTH_500_002"))
        })?;

        let item = response.item.ok_or(
            async_graphql::ServerError::new(
                "The secret key for the specified KID could not be found.",
                None,
            )
            .extend_with(|_, e| e.set("code", "AUTH_401_006")),
        )?;

        let secret = item
            .get("secret")
            .ok_or(
                async_graphql::ServerError::new(
                    "The `secret` column was not found in the record for the private key.",
                    None,
                )
                .extend_with(|_, e| e.set("code", "AUTH_500_004")),
            )?
            .as_s()
            .map_err(|_| {
                async_graphql::ServerError::new(
                    "The type of the private key was not a string.",
                    None,
                )
                .extend_with(|_, e| e.set("code", "AUTH_500_005"))
            })?;

        let mut validation = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256);
        validation.validate_exp = true; // 有効期限のバリデーション
        validation.validate_aud = false;

        let token_data = jsonwebtoken::decode::<Claims>(
            &refresh_token,
            &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
            &validation,
        )
        .map_err(|_| {
            async_graphql::ServerError::new("Failed to decode or validate the JWT.", None)
                .extend_with(|_, e| e.set("code", "AUTH_401_007"))
        })?;

        Ok(token_data)
    }
}
