use async_graphql::*;

pub struct MutationRoot {
    pub anki_mutation_resolver:
        std::sync::Arc<crate::resolver::anki::mutation::AnkiMutationResolver>,
    pub bookmark_mutation_resolver:
        std::sync::Arc<crate::resolver::bookmark::mutation::BookmarkMutationResolver>,
    pub to_do_mutation_resolver:
        std::sync::Arc<crate::resolver::to_do::mutation::ToDoMutationResolver>,
    pub typing_mutation_resolver:
        std::sync::Arc<crate::resolver::typing::mutation::TypingMutationResolver>,
}

#[async_graphql::Object]
impl MutationRoot {
    pub async fn create_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::anki::mutation::CreateAnkiInput,
    ) -> Result<crate::resolver::anki::Anki, async_graphql::Error> {
        self.anki_mutation_resolver.create_anki(ctx, input).await
    }

    pub async fn update_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::anki::mutation::UpdateAnkiInput,
    ) -> Result<crate::resolver::anki::Anki, async_graphql::Error> {
        self.anki_mutation_resolver.update_anki(ctx, input).await
    }

    pub async fn create_bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::bookmark::mutation::CreateBookmarkInput,
    ) -> Result<crate::resolver::bookmark::Bookmark, async_graphql::Error> {
        self.bookmark_mutation_resolver
            .create_bookmark(ctx, input)
            .await
    }

    pub async fn create_todo(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::to_do::mutation::CreateToDoInput,
    ) -> Result<crate::resolver::to_do::ToDo, async_graphql::Error> {
        self.to_do_mutation_resolver.create_to_do(ctx, input).await
    }

    pub async fn update_todo(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::to_do::mutation::UpdateToDoInput,
    ) -> Result<crate::resolver::to_do::ToDo, async_graphql::Error> {
        self.to_do_mutation_resolver.update_to_do(ctx, input).await
    }

    pub async fn upsert_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::typing::mutation::TypingUpsertInput,
    ) -> Result<crate::entity::typing::Typing, async_graphql::Error> {
        self.typing_mutation_resolver
            .upsert_typing(ctx, input)
            .await
    }

    pub async fn delete_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: crate::resolver::typing::mutation::TypingDeleteInput,
    ) -> Result<crate::entity::typing::Typing, async_graphql::Error> {
        self.typing_mutation_resolver
            .delete_typing(ctx, input)
            .await
    }
}
