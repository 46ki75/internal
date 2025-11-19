pub mod mutation;
pub mod query;

use super::entity::*;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct Typing {
    pub id: String,
    pub text: String,
    pub description: String,
}

impl From<TypingEntity> for Typing {
    fn from(value: TypingEntity) -> Self {
        Self {
            id: value.id,
            text: value.text,
            description: value.description,
        }
    }
}
