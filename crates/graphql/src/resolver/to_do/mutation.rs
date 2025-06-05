pub struct ToDoMutationResolver;

#[derive(async_graphql::InputObject, Debug)]
pub struct CreateToDoInput {
    pub title: String,
    pub severity: Option<super::ToDoSeverity>,
}

#[derive(async_graphql::InputObject, Debug)]
pub struct UpdateToDoInput {
    pub id: String,
    pub is_done: bool,
}

#[async_graphql::Object]
impl ToDoMutationResolver {
    pub async fn create_to_do(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: CreateToDoInput,
    ) -> Result<super::ToDo, async_graphql::Error> {
        let to_do_service = ctx.data::<std::sync::Arc<crate::service::to_do::ToDoService>>()?;

        let severity = input.severity.map(|s| s.into());

        let to_do = to_do_service
            .create_to_do(input.title, severity)
            .await
            .map_err(|e| e.to_string())?
            .into();

        Ok(to_do)
    }

    pub async fn update_to_do(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: UpdateToDoInput,
    ) -> Result<super::ToDo, async_graphql::Error> {
        let to_do_service = ctx.data::<std::sync::Arc<crate::service::to_do::ToDoService>>()?;

        let to_do = to_do_service
            .update_to_do(input.id, input.is_done)
            .await
            .map_err(|e| e.to_string())?
            .into();

        Ok(to_do)
    }
}
