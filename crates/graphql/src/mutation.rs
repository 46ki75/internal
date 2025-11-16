#[derive(async_graphql::MergedObject, Debug, Default)]
pub struct MutationRoot(
    crate::anki::resolver::mutation::AnkiMutationResolver,
    crate::bookmark::resolver::mutation::BookmarkMutationResolver,
    crate::to_do::resolver::mutation::ToDoMutationResolver,
    crate::typing::resolver::mutation::TypingMutationResolver,
);
