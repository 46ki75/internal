use async_graphql::ErrorExtensions;

use crate::services;

pub struct Refresh {
    kid: String,
}

impl Refresh {
    pub async fn new(ctx: &async_graphql::Context<'_>) -> Result<Self, async_graphql::Error> {
        let raw_cookie = ctx
            .data::<lambda_http::http::HeaderMap<lambda_http::http::HeaderValue>>()
            .unwrap()
            .get("cookie")
            .ok_or(
                async_graphql::FieldError::new("Cookies are not enabled.")
                    .extend_with(|_, e| e.set("code", "AUTH_401_002")),
            )?
            .to_str()
            .map_err(|_| {
                async_graphql::FieldError::new("Failed to parse the cookie.")
                    .extend_with(|_, e| e.set("code", "AUTH_401_003"))
            })?;

        let raw_cookies = raw_cookie.split(';');

        let mut refresh_token = String::new();

        for cookie_string in raw_cookies {
            let cookie = cookie::Cookie::parse(cookie_string).unwrap();
            if cookie.name() == "JWT_REFRESH_TOKEN" {
                refresh_token = cookie.value().to_string()
            }
        }

        if refresh_token.is_empty() {
            return Err(async_graphql::FieldError::new(
                "The `JWT_REFRESH_TOKEN` cookie is missing. Please log in again.",
            )
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
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S("JWT_REFRESH_SECRET#".into()),
            )
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

        let token_data = jsonwebtoken::decode::<services::jwt::Claims>(
            &refresh_token,
            &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
            &validation,
        )
        .map_err(|_| {
            async_graphql::ServerError::new("Failed to decode or validate the JWT.", None)
                .extend_with(|_, e| e.set("code", "AUTH_401_007"))
        })?;

        // # --------------------------------------------------------------------------------
        //
        // Issuing a JWT
        //
        // # --------------------------------------------------------------------------------

        // TODO: ACCESS_TOKEN の発行

        // let rust_env = std::env::var("ENVIRONMENT").unwrap_or(String::from("production"));
        // let domain = if rust_env == "development" {
        //     "localhost".to_string()
        // } else {
        //     "internal.46ki75.com".to_string()
        // };

        // let jwt_refresh_token =
        //     jwt::Jwt::generate_refresh_token(&config, domain.clone(), username.clone()).await?;

        // let jwt_refresh_token_cookie =
        //     cookie::Cookie::build(("JWT_REFRESH_TOKEN", jwt_refresh_token.value))
        //         .domain(domain)
        //         .path("/")
        //         .secure(rust_env != "development")
        //         .same_site(cookie::SameSite::Strict)
        //         .http_only(true)
        //         .build();

        // ctx.insert_http_header("set-cookie", jwt_refresh_token_cookie.to_string());

        // Err(async_graphql::Error::new("MyMessage")
        //     .extend_with(|_, e| e.set("details", "CAN_NOT_FETCH")))

        Ok(Refresh {
            kid: token_data.header.kid.unwrap(),
        })
    }
}

#[async_graphql::Object]
impl Refresh {
    pub async fn kid(&self) -> String {
        self.kid.to_string()
    }
}
