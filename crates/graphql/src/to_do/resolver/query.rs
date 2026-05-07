use crate::to_do::use_case::ToDoUseCase;

#[derive(Debug, Default)]
pub struct ToDoQueryResolver;

#[async_graphql::Object]
impl ToDoQueryResolver {
    pub async fn to_do_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<super::ToDo>, async_graphql::Error> {
        let to_do_use_case = ctx.data::<std::sync::Arc<ToDoUseCase>>()?;

        let notion_to_do_list = to_do_use_case
            .list_notion_to_do()
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?
            .into_iter()
            .map(|to_do_entity| to_do_entity.into())
            .collect();

        Ok(notion_to_do_list)
    }
}
