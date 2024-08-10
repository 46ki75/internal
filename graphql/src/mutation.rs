use async_graphql::*;

pub struct MutationRoot;

use crate::resolvers;

#[async_graphql::Object]
impl MutationRoot {
    pub async fn register(
        &self,
        ctx: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<resolvers::register::Register, async_graphql::Error> {
        resolvers::register::Register::new(ctx, username, password).await
    }
}
