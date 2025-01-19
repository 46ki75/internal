use async_graphql::*;

pub struct MutationRoot;

#[async_graphql::Object]
impl MutationRoot {
    pub async fn create_bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::bookmark::mutation::CreateBookmarkInput,
    ) -> Result<crate::model::bookmark::Bookmark, async_graphql::Error> {
        crate::model::bookmark::mutation::BookmarkMutation
            .create_bookmark(ctx, input)
            .await
    }

    pub async fn create_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::anki::mutation::CreateAnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        crate::model::anki::mutation::AnkiMutation
            .create_anki(ctx, input)
            .await
    }

    pub async fn update_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::anki::mutation::UpdateAnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        crate::model::anki::mutation::AnkiMutation
            .update_anki(ctx, input)
            .await
    }

    pub async fn upsert_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::typing::mutation::TypingInput,
    ) -> Result<crate::model::typing::Typing, async_graphql::Error> {
        crate::model::typing::mutation::TypingMutation
            .upsert_typing(ctx, input)
            .await
    }

    pub async fn delete_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::typing::mutation::TypingDeleteInput,
    ) -> Result<String, async_graphql::Error> {
        crate::model::typing::mutation::TypingMutation
            .delete_typing(ctx, input)
            .await
    }

    pub async fn update_routine(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::routine::mutation::UpdateRoutineInput,
    ) -> Result<crate::model::routine::Routine, async_graphql::Error> {
        crate::model::routine::mutation::RoutineMutation
            .update_routine(ctx, input)
            .await
    }

    pub async fn create_todo(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::model::todo::mutation::CreateToDoInput,
    ) -> Result<crate::model::todo::ToDo, async_graphql::Error> {
        crate::model::todo::mutation::ToDoMutation
            .create_todo(ctx, input)
            .await
    }
}
