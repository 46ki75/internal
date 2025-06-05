pub struct TypingQueryResolver;

impl TypingQueryResolver {
    pub async fn typing_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<super::Typing>, async_graphql::Error> {
        let typing_service = ctx.data::<std::sync::Arc<crate::service::typing::TypingService>>()?;

        let results = typing_service
            .typing_list()
            .await
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|typing| typing.into())
            .collect();

        Ok(results)
    }
}
