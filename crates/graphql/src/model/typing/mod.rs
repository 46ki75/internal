pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct Typing {
    pub id: String,
    pub text: String,
    pub description: String,
}
