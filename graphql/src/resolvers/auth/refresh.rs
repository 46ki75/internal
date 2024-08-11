use async_graphql::ErrorExtensions;

use crate::services;

pub struct Refresh {
    kid: String,
}

impl Refresh {
    pub async fn new(ctx: &async_graphql::Context<'_>) -> Result<Self, async_graphql::Error> {
        // コンテキストからクッキーの文字列スライスを取得
        let raw_cookie = ctx
            .data::<lambda_http::http::HeaderMap<lambda_http::http::HeaderValue>>()
            .unwrap()
            .get("cookie")
            .ok_or(
                async_graphql::FieldError::new("Cookies are not enabled.").extend_with(|_, e| {
                    e.set("code", "AUTH_401_002");
                    e.set("directive", "LOGIN");
                }),
            )?
            .to_str()
            .map_err(|_| {
                async_graphql::FieldError::new("Failed to parse the cookie.").extend_with(|_, e| {
                    e.set("code", "AUTH_401_003");
                    e.set("directive", "LOGIN");
                })
            })?;

        let token_data = services::jwt::Jwt::validateand_decode_token(
            raw_cookie.into(),
            crate::services::jwt::TokenType::JwtRefreshToken,
        )
        .await?;

        // # --------------------------------------------------------------------------------
        //
        // Issuing a JWT
        //
        // # --------------------------------------------------------------------------------

        let lifetime = 10;

        let custom_context = ctx
            .data::<crate::context::CustomContext>()
            .map_err(|_| async_graphql::Error::new("Failed to retrieve `CustomContext`."))?;

        let environment = custom_context.environment.clone();
        let domain = custom_context.domain.clone();

        let region = aws_config::Region::from_static("ap-northeast-1");
        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region)
            .load()
            .await;

        let username = token_data.claims.sub;

        let jwt_access_token = services::jwt::Jwt::generate_token(
            &config,
            crate::services::jwt::TokenType::JwtAccessToken,
            domain.clone(),
            username.clone(),
            lifetime,
        )
        .await?;

        // JWT_REFRESH_TOKEN と引き換えに JWT_ACCESS_TOKEN を発行

        let jwt_refresh_token_cookie =
            cookie::Cookie::build(("JWT_ACCESS_TOKEN", jwt_access_token.value))
                .domain(domain)
                .path("/")
                .secure(environment != "development")
                .same_site(cookie::SameSite::Strict)
                .http_only(true)
                .expires(
                    cookie::time::OffsetDateTime::now_utc()
                        + std::time::Duration::from_secs((lifetime * 60).into()),
                )
                .build();

        ctx.insert_http_header("set-cookie", jwt_refresh_token_cookie.to_string());

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
