use async_graphql::*;

pub struct MutationRoot;

#[async_graphql::Object]
impl MutationRoot {
    pub async fn create_bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
        name: String,
        url: String,
    ) -> Result<crate::model::bookmark::Bookmark, async_graphql::Error> {
        crate::model::bookmark::Bookmark::new(ctx, name, url).await
    }
}
