pub mod mutation;
pub mod query;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct Typing {
    pub id: String,
    pub text: String,
    pub description: String,
}

impl From<crate::entity::typing::TypingEntity> for Typing {
    fn from(value: crate::entity::typing::TypingEntity) -> Self {
        Self {
            id: value.id,
            text: value.text,
            description: value.description,
        }
    }
}
