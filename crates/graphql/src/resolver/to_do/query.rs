pub struct ToDoQueryResolver;

#[async_graphql::Object]
impl ToDoQueryResolver {
    pub async fn to_do_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::entity::to_do::ToDo>, async_graphql::Error> {
        let to_do_service = ctx.data::<std::sync::Arc<crate::service::to_do::ToDoService>>()?;

        let notion_to_do_list = to_do_service
            .list_notion_to_do()
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(notion_to_do_list)
    }
}
