use super::super::service::*;

#[derive(Debug, Default)]
pub struct TypingMutationResolver;

#[derive(async_graphql::InputObject, Debug, Default)]
pub struct TypingUpsertInput {
    pub id: Option<String>,
    pub text: String,
    pub description: String,
}

#[derive(async_graphql::InputObject, Debug, Default)]
pub struct TypingDeleteInput {
    pub id: String,
}

#[async_graphql::Object]
impl TypingMutationResolver {
    pub async fn upsert_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: TypingUpsertInput,
    ) -> Result<super::Typing, async_graphql::Error> {
        let typing_service = ctx.data::<std::sync::Arc<TypingService>>()?;

        let result = typing_service
            .upsert_typing(input.id, input.text, input.description)
            .await
            .map_err(|e| e.to_string())?
            .into();

        Ok(result)
    }

    pub async fn delete_typing(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: TypingDeleteInput,
    ) -> Result<super::Typing, async_graphql::Error> {
        let typing_service = ctx.data::<std::sync::Arc<TypingService>>()?;

        let result = typing_service
            .delete_typing(input.id)
            .await
            .map_err(|e| e.to_string())?
            .into();

        Ok(result)
    }
}
