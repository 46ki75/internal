//! In-process GraphQL API/wiring tests.
//!
//! Builds the real GraphQL schema (`build_schema`) with stub-backed use_cases
//! and executes queries against it, exercising resolver wiring and the
//! `ctx.data::<Arc<UseCase>>()` injection. Hermetic: no network/AWS.

use std::sync::Arc;

use http_api::schema::build_schema;

type ApiSchema = async_graphql::Schema<
    http_api::query::QueryRoot,
    http_api::mutation::MutationRoot,
    async_graphql::EmptySubscription,
>;

/// A schema with every feature use_case backed by its repository stub.
fn stub_schema() -> ApiSchema {
    build_schema(
        Arc::new(http_api::anki::use_case::AnkiUseCase {
            anki_repository: Arc::new(http_api::anki::repository::AnkiRepositoryStub),
        }),
        Arc::new(http_api::bookmark::use_case::BookmarkUseCase {
            bookmark_repository: Arc::new(http_api::bookmark::repository::BookmarkRepositoryStub),
        }),
        Arc::new(http_api::to_do::use_case::ToDoUseCase {
            to_do_repository: Arc::new(http_api::to_do::repository::ToDoRepositoryStub),
        }),
        Arc::new(http_api::typing::use_case::TypingUseCase {
            typing_repository: Arc::new(http_api::typing::repository::TypingRepositoryStub),
        }),
    )
}

/// Execute `query`, asserting no GraphQL errors, and return the `data` as JSON.
async fn exec(query: &str) -> serde_json::Value {
    let response = stub_schema().execute(query).await;
    assert!(response.errors.is_empty(), "errors: {:?}", response.errors);
    serde_json::to_value(&response.data).unwrap()
}

#[tokio::test]
async fn typing_list_query() {
    let data = exec("{ typingList { id text description } }").await;

    let rows = data["typingList"].as_array().unwrap();
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0]["id"], "93165a44-43c8-4790-84ad-08de54ec549a");
    assert_eq!(rows[0]["text"], "text");
}

#[tokio::test]
async fn bookmark_list_query() {
    let data = exec("{ bookmarkList { id name } }").await;

    let rows = data["bookmarkList"].as_array().unwrap();
    assert_eq!(rows[0]["name"], "三菱UFJダイレクト");
}

#[tokio::test]
async fn to_do_list_query() {
    let data = exec("{ toDoList { id title isDone } }").await;

    let rows = data["toDoList"].as_array().unwrap();
    assert!(!rows.is_empty());
    assert!(rows[0]["title"].is_string());
}

#[tokio::test]
async fn unknown_field_is_a_query_error() {
    // A field that doesn't exist should surface as a GraphQL validation error,
    // not a panic or a 500.
    let response = stub_schema().execute("{ thisFieldDoesNotExist }").await;
    assert!(!response.errors.is_empty());
}
