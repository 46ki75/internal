#[derive(async_graphql::MergedObject, Debug, Default)]
pub struct QueryRoot(
    crate::resolver::anki::query::AnkiQueryResolver,
    crate::resolver::bookmark::query::BookmarkQueryResolver,
    crate::resolver::to_do::query::ToDoQueryResolver,
    crate::resolver::typing::query::TypingQueryResolver,
);
