use crate::typing::use_case::TypingUseCase;

#[derive(Debug, Default)]
pub struct TypingQueryResolver;

#[async_graphql::Object]
impl TypingQueryResolver {
    pub async fn typing_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<super::Typing>, async_graphql::Error> {
        let typing_use_case = ctx.data::<std::sync::Arc<TypingUseCase>>()?;

        let results = typing_use_case
            .typing_list()
            .await
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|typing| typing.into())
            .collect();

        Ok(results)
    }
}
