use async_graphql::*;

pub struct QueryRoot;

#[async_graphql::Object]
impl QueryRoot {
    /// Returns a greeting message along with the programming language.
    pub async fn greet(
        &self,
        _ctx: &async_graphql::Context<'_>,
    ) -> Result<String, async_graphql::Error> {
        Ok(String::from("Hello, GraphQL!"))
    }

    pub async fn anki_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::anki::Anki>, async_graphql::Error> {
        crate::model::anki::query::AnkiQuery.list_anki(ctx).await
    }

    pub async fn bookmark_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::bookmark::Bookmark>, async_graphql::Error> {
        crate::model::bookmark::query::BookmarkQuery
            .list_bookmark(ctx)
            .await
    }
}
