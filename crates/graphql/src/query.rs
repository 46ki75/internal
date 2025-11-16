#[derive(async_graphql::MergedObject, Debug, Default)]
pub struct QueryRoot(
    crate::anki::resolver::query::AnkiQueryResolver,
    crate::bookmark::resolver::query::BookmarkQueryResolver,
    crate::to_do::resolver::mutation::ToDoMutationResolver,
    crate::resolver::typing::query::TypingQueryResolver,
);
