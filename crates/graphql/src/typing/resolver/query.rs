use super::super::service::*;

#[derive(Debug, Default)]
pub struct TypingQueryResolver;

#[async_graphql::Object]
impl TypingQueryResolver {
    pub async fn typing_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<super::Typing>, async_graphql::Error> {
        let typing_service = ctx.data::<std::sync::Arc<TypingService>>()?;

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
