pub struct ToDoMutationResolver;

#[derive(async_graphql::InputObject, Debug)]
pub struct CreateToDoInput {
    pub title: String,
}

#[async_graphql::Object]
impl ToDoMutationResolver {
    pub async fn create_to_do(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: CreateToDoInput,
    ) -> Result<crate::model::todo::ToDo, async_graphql::Error> {
        let to_do_service = ctx.data::<crate::service::to_do::ToDoService>()?;

        let to_do = to_do_service
            .create_to_do(input.title)
            .await
            .map_err(|e| e.to_string())?;

        Ok(to_do)
    }
}
