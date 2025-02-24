pub struct TypingMutationResolver;

#[derive(async_graphql::InputObject)]
pub struct TypingUpsertInput {
    pub text: String,
    pub description: String,
}

#[derive(async_graphql::InputObject)]
pub struct TypingDeleteInput {
    pub id: String,
}

impl TypingMutationResolver {
    pub async fn upsert_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: TypingUpsertInput,
    ) -> Result<crate::model::typing::Typing, async_graphql::Error> {
        let typing_service = ctx.data::<std::sync::Arc<crate::service::typing::TypingService>>()?;

        let result = typing_service
            .upsert_typing(input.text, input.description)
            .await
            .map_err(|e| e.to_string())?;

        Ok(result)
    }

    pub async fn delete_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: TypingDeleteInput,
    ) -> Result<crate::model::typing::Typing, async_graphql::Error> {
        let typing_service = ctx.data::<std::sync::Arc<crate::service::typing::TypingService>>()?;

        let result = typing_service
            .delete_typing(input.id)
            .await
            .map_err(|e| e.to_string())?;

        Ok(result)
    }
}
