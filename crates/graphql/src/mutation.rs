#[derive(async_graphql::MergedObject, Debug, Default)]
pub struct MutationRoot(
    crate::resolver::anki::mutation::AnkiMutationResolver,
    crate::resolver::bookmark::mutation::BookmarkMutationResolver,
    crate::resolver::to_do::mutation::ToDoMutationResolver,
    crate::resolver::typing::mutation::TypingMutationResolver,
);
