use async_graphql::*;

pub struct MutationRoot;

use crate::resolvers;

#[async_graphql::Object]
impl MutationRoot {
    pub async fn bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
        name: String,
        url: String,
    ) -> Result<resolvers::mutation::bookmark::MutationBookmark, async_graphql::Error> {
        resolvers::mutation::bookmark::MutationBookmark::new(ctx, name, url).await
    }
}
