pub struct Session {
    username: String,
    expires_at: i64,
}

impl Session {
    pub async fn new(ctx: &async_graphql::Context<'_>) -> Result<Self, async_graphql::Error> {
        // コンテキストからクッキーの文字列スライスを取得
        let raw_cookie = ctx
            .data::<lambda_http::http::HeaderMap<lambda_http::http::HeaderValue>>()
            .unwrap()
            .get("cookie")
            .ok_or(async_graphql::FieldError::new("Cookies are not enabled."))?
            .to_str()
            .map_err(|_| async_graphql::FieldError::new("Failed to parse the cookie."))?;

        let token_data = crate::services::jwt::Jwt::validateand_decode_token(
            raw_cookie.into(),
            "JWT_ACCESS_TOKEN".into(),
        )
        .await?;

        let username = token_data.claims.sub;

        let expires_at = token_data.claims.exp;

        Ok(Session {
            username,
            expires_at,
        })
    }
}

#[async_graphql::Object]
impl Session {
    /// トークンに関連付けられたユーザー名
    pub async fn username(&self) -> String {
        self.username.to_string()
    }

    /// トークンが失効するタイムスタンプ
    pub async fn expires_at(&self) -> i64 {
        self.expires_at
    }
}
