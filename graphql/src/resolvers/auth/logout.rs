// pub struct DeleteRefreshToken;
// pub struct DeleteAccessToken;

pub struct Logout;

impl Logout {
    pub async fn new() -> Result<Self, async_graphql::Error> {
        Ok(Logout)
    }
}

#[async_graphql::Object]
impl Logout {
    /// クッキー内の `JWT_REFRESH_TOKEN` を削除します。
    ///
    /// ログアウトを行う際、`JWT_REFRESH_TOKEN` と `JWT_REFRESH_TOKEN` の
    /// 削除は2回の HTTP リクエストに分けて行う必要があります。
    /// (`set-cookie` ヘッダーを同時に1つしか挿入できない async-graphql の仕様)
    pub async fn delete_refresh_token(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<bool, async_graphql::Error> {
        let custom_context = ctx
            .data::<crate::context::CustomContext>()
            .map_err(|_| async_graphql::Error::new("Failed to retrieve `CustomContext`."))?;

        let environment = custom_context.environment.clone();
        let domain = custom_context.domain.clone();

        let cookie = cookie::Cookie::build(("JWT_REFRESH_TOKEN", ""))
            .domain(domain.clone())
            .path("/")
            .secure(environment != "development")
            .same_site(cookie::SameSite::Strict)
            .http_only(true)
            .expires(cookie::time::OffsetDateTime::now_utc() - std::time::Duration::from_secs(60))
            .build();

        ctx.insert_http_header("set-cookie", cookie.to_string());

        Ok(true)
    }

    /// クッキー内の `JWT_ACCESS_TOKEN` を削除します。
    ///
    /// ログアウトを行う際、`JWT_REFRESH_TOKEN` と `JWT_REFRESH_TOKEN` の
    /// 削除は2回の HTTP リクエストに分けて行う必要があります。
    /// (`set-cookie` ヘッダーを同時に1つしか挿入できない async-graphql の仕様)
    pub async fn delete_access_token(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<bool, async_graphql::Error> {
        let custom_context = ctx
            .data::<crate::context::CustomContext>()
            .map_err(|_| async_graphql::Error::new("Failed to retrieve `CustomContext`."))?;

        let environment = custom_context.environment.clone();
        let domain = custom_context.domain.clone();

        let cookie = cookie::Cookie::build(("JWT_ACCESS_TOKEN", ""))
            .domain(domain)
            .path("/")
            .secure(environment != "development")
            .same_site(cookie::SameSite::Strict)
            .http_only(true)
            .expires(cookie::time::OffsetDateTime::now_utc() - std::time::Duration::from_secs(60))
            .build();

        ctx.insert_http_header("set-cookie", cookie.to_string());

        Ok(true)
    }
}
