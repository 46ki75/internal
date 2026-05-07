use crate::typing::use_case::TypingUseCase;

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
        let typing_use_case = ctx.data::<std::sync::Arc<TypingUseCase>>()?;

        let result = typing_use_case
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
        let typing_use_case = ctx.data::<std::sync::Arc<TypingUseCase>>()?;

        let result = typing_use_case
            .delete_typing(input.id)
            .await
            .map_err(|e| e.to_string())?
            .into();

        Ok(result)
    }
}
