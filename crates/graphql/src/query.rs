use async_graphql::*;

pub struct QueryRoot;

use crate::resolvers;

#[async_graphql::Object]
impl QueryRoot {
    /// Returns a greeting message along with the programming language.
    pub async fn greet(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<resolvers::query::greet::Greet, async_graphql::Error> {
        resolvers::query::greet::Greet::new(ctx)
    }

    pub async fn anki(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<resolvers::query::anki::Anki, async_graphql::Error> {
        resolvers::query::anki::Anki::new(ctx)
    }

    pub async fn bookmarks(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::bookmark::Bookmark>, async_graphql::Error> {
        crate::model::bookmark::query::QueryBookmark
            .list_bookmark(ctx)
            .await
    }
}
