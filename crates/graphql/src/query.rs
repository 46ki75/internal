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

    pub async fn anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::anki::query::AnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        crate::model::anki::query::AnkiQuery.anki(ctx, input).await
    }

    pub async fn anki_list(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: Option<crate::model::anki::query::ListAnkiInput>,
    ) -> Result<crate::model::anki::AnkiConnection, async_graphql::Error> {
        crate::model::anki::query::AnkiQuery
            .list_anki(ctx, input)
            .await
    }

    pub async fn bookmark_list(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: Option<crate::model::bookmark::query::BookmarkListInput>,
    ) -> Result<crate::model::bookmark::BookmarkConnection, async_graphql::Error> {
        crate::model::bookmark::query::BookmarkQuery
            .list_bookmark(ctx, input)
            .await
    }

    pub async fn translate(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::translation::query::TranslateInput,
    ) -> Result<String, async_graphql::Error> {
        crate::model::translation::query::TranslationQuery
            .translate(ctx, input)
            .await
    }

    pub async fn translate_usage(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<crate::model::translation::query::TranslateUsageResponse, async_graphql::Error>
    {
        crate::model::translation::query::TranslationQuery
            .translate_usage(ctx)
            .await
    }

    pub async fn notion_todo_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<crate::model::todo::ToDoConnection, async_graphql::Error> {
        crate::model::todo::query::ToDoQuery
            .list_notion_to_do(ctx)
            .await
    }

    pub async fn github_notification_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<crate::model::todo::ToDoConnection, async_graphql::Error> {
        crate::model::todo::query::ToDoQuery
            .list_github_todo(ctx)
            .await
    }

    pub async fn typing_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::typing::Typing>, async_graphql::Error> {
        crate::model::typing::query::TypingQuery.typing(ctx).await
    }
}
