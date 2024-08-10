use async_graphql::*;

pub struct MutationRoot;

use crate::resolvers;

#[async_graphql::Object]
impl MutationRoot {
    /// Registering a new user.
    /// - `username` You can use the following characters: A-Z, a-z, 0-9, "-", and "_".
    /// - `password` Blank spaces are not allowed.
    pub async fn register(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<resolvers::register::Register, async_graphql::Error> {
        resolvers::register::Register::new(ctx, username, password).await
    }

    pub async fn login(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<resolvers::login::Login, async_graphql::Error> {
        resolvers::login::Login::new(ctx, username, password).await
    }
}
