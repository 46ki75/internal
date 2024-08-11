pub mod login;
pub mod logout;
pub mod refresh;
pub mod signup;

use async_graphql::*;

pub struct Auth;

impl Auth {
    pub async fn new() -> Result<Auth, async_graphql::Error> {
        Ok(Auth)
    }
}

#[async_graphql::Object]
impl Auth {
    /// Signuping a new user.
    /// - `username` You can use the following characters: A-Z, a-z, 0-9, "-", and "_".
    /// - `password` Blank spaces are not allowed.
    pub async fn signup(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<crate::resolvers::auth::signup::Signup, async_graphql::Error> {
        crate::resolvers::auth::signup::Signup::new(ctx, username, password).await
    }

    /// Log in with your username and password:
    /// - `username`: The username to log in with
    /// - `password`: The password
    pub async fn login(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<crate::resolvers::auth::login::Login, async_graphql::Error> {
        crate::resolvers::auth::login::Login::new(ctx, username, password).await
    }

    /// This method uses the `JWT_REFRESH_TOKEN` set
    /// in the cookie to obtain a `JWT_ACCESS_TOKEN`,
    /// which is then also set in the cookie.
    pub async fn refresh(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<crate::resolvers::auth::refresh::Refresh, async_graphql::Error> {
        crate::resolvers::auth::refresh::Refresh::new(ctx).await
    }

    /// ログアウトを行う際、`JWT_REFRESH_TOKEN` と `JWT_REFRESH_TOKEN` の
    /// 削除は2回の HTTP リクエストに分けて行う必要があります。
    /// (`set-cookie` ヘッダーを同時に1つしか挿入できない async-graphql の仕様)
    pub async fn logout(
        &self,
    ) -> Result<crate::resolvers::auth::logout::Logout, async_graphql::Error> {
        crate::resolvers::auth::logout::Logout::new().await
    }
}
