#[derive(async_graphql::MergedObject, Debug, Default)]
pub struct QueryRoot(
    crate::anki::resolver::query::AnkiQueryResolver,
    crate::resolver::bookmark::query::BookmarkQueryResolver,
    crate::resolver::to_do::query::ToDoQueryResolver,
    crate::resolver::typing::query::TypingQueryResolver,
);
