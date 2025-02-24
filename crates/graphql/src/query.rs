pub struct QueryRoot {
    pub anki_query_resolver: std::sync::Arc<crate::resolver::anki::query::AnkiQueryResolver>,
    pub bookmark_query_resolver:
        std::sync::Arc<crate::resolver::bookmark::query::BookmarkQueryResolver>,
    pub to_do_query_resolver: std::sync::Arc<crate::resolver::to_do::query::ToDoQueryResolver>,
}

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
        input: crate::resolver::anki::query::AnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        self.anki_query_resolver.anki(ctx, input).await
    }

    pub async fn anki_list(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: Option<crate::resolver::anki::query::AnkiListInput>,
    ) -> Result<crate::model::anki::AnkiConnection, async_graphql::Error> {
        self.anki_query_resolver.anki_list(ctx, input).await
    }

    pub async fn bookmark_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::bookmark::Bookmark>, async_graphql::Error> {
        self.bookmark_query_resolver.list_bookmark(ctx).await
    }

    pub async fn todo_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::to_do::ToDo>, async_graphql::Error> {
        self.to_do_query_resolver.to_do_list(ctx).await
    }

    pub async fn typing_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::typing::Typing>, async_graphql::Error> {
        crate::model::typing::query::TypingQuery.typing(ctx).await
    }
}
