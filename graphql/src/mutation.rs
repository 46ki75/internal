use async_graphql::*;

pub struct MutationRoot;

use crate::resolvers::{self};

#[async_graphql::Object]
impl MutationRoot {
    /// Signuping a new user.
    /// - `username` You can use the following characters: A-Z, a-z, 0-9, "-", and "_".
    /// - `password` Blank spaces are not allowed.
    pub async fn signup(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<resolvers::signup::Signup, async_graphql::Error> {
        resolvers::signup::Signup::new(ctx, username, password).await
    }

    /// Log in with your username and password:
    /// - `username`: The username to log in with
    /// - `password`: The password
    pub async fn login(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<resolvers::login::Login, async_graphql::Error> {
        resolvers::login::Login::new(ctx, username, password).await
    }

    /// This method uses the `JWT_REFRESH_TOKEN` set
    /// in the cookie to obtain a `JWT_ACCESS_TOKEN`,
    /// which is then also set in the cookie.
    pub async fn refresh(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<resolvers::refresh::Refresh, async_graphql::Error> {
        resolvers::refresh::Refresh::new(ctx).await
    }
}
