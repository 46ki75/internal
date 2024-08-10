use crate::context::GraphQLContext;

pub mod login;
pub mod register;

pub struct Mutation;

#[juniper::graphql_object(Context = GraphQLContext)]
impl Mutation {
    #[graphql(description = "Login with password.")]
    async fn login(
        context: &GraphQLContext,
        #[graphql(description = "your username")] username: String,
        #[graphql(description = "your password")] password: String,
    ) -> Result<login::LoginMutation, juniper::FieldError> {
        login::LoginMutation::new(context, username, password).await
    }

    #[graphql(description = "Register user.")]
    async fn register(
        context: &GraphQLContext,
        #[graphql(description = "your username")] username: String,
        #[graphql(description = "your password")] password: String,
    ) -> Result<register::RegisterMutation, juniper::FieldError> {
        register::RegisterMutation::new(context, username, password).await
    }
}
