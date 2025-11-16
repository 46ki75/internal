#[derive(async_graphql::MergedObject, Debug, Default)]
pub struct MutationRoot(
    crate::anki::resolver::mutation::AnkiMutationResolver,
    crate::bookmark::resolver::mutation::BookmarkMutationResolver,
    crate::resolver::to_do::mutation::ToDoMutationResolver,
    crate::resolver::typing::mutation::TypingMutationResolver,
);
