use async_graphql::{http::GraphiQLSource, EmptySubscription, Schema};
use lambda_http::{http::Method, Body, Error, Request, Response};

pub mod config;
pub mod entity;
pub mod error;
pub mod mutation;
pub mod query;
pub mod record;
pub mod repository;
pub mod resolver;
pub mod service;
pub mod util;

static SCHEMA: tokio::sync::OnceCell<
    Schema<crate::query::QueryRoot, crate::mutation::MutationRoot, EmptySubscription>,
> = tokio::sync::OnceCell::const_new();

async fn try_init_schema() -> Result<
    Schema<crate::query::QueryRoot, crate::mutation::MutationRoot, EmptySubscription>,
    crate::error::Error,
> {
    tracing::info!("Initializing schema");

    let config = std::sync::Arc::new(crate::config::Config::try_new_async().await?);

    tracing::debug!("Injecting dependencies: Anki");
    let anki_repository = std::sync::Arc::new(crate::repository::anki::AnkiRepositoryImpl {
        config: config.clone(),
    });
    let anki_service = std::sync::Arc::new(crate::service::anki::AnkiService { anki_repository });
    let anki_query_resolver = std::sync::Arc::new(crate::resolver::anki::query::AnkiQueryResolver);
    let anki_mutation_resolver =
        std::sync::Arc::new(crate::resolver::anki::mutation::AnkiMutationResolver);

    tracing::debug!("Injecting dependencies: Bookmark");
    let bookmark_repository =
        std::sync::Arc::new(crate::repository::bookmark::BookmarkRepositoryImpl {
            config: config.clone(),
        });
    let bookmark_service = std::sync::Arc::new(crate::service::bookmark::BookmarkService {
        bookmark_repository,
    });
    let bookmark_query_resolver =
        std::sync::Arc::new(crate::resolver::bookmark::query::BookmarkQueryResolver);
    let bookmark_mutation_resolver =
        std::sync::Arc::new(crate::resolver::bookmark::mutation::BookmarkMutationResolver);

    tracing::debug!("Injecting dependencies: ToDO");
    let to_do_repository = std::sync::Arc::new(crate::repository::to_do::ToDoRepositoryImpl {
        config: config.clone(),
    });
    let to_do_service =
        std::sync::Arc::new(crate::service::to_do::ToDoService { to_do_repository });
    let to_do_query_resolver =
        std::sync::Arc::new(crate::resolver::to_do::query::ToDoQueryResolver);
    let to_do_mutation_resolver =
        std::sync::Arc::new(crate::resolver::to_do::mutation::ToDoMutationResolver);

    tracing::debug!("Injecting dependencies: Typing");
    let typing_repository: std::sync::Arc<repository::typing::TypingRepositoryImpl> =
        std::sync::Arc::new(crate::repository::typing::TypingRepositoryImpl {
            config: config.clone(),
        });
    let typing_service =
        std::sync::Arc::new(crate::service::typing::TypingService { typing_repository });
    let typing_query_resolver =
        std::sync::Arc::new(crate::resolver::typing::query::TypingQueryResolver);
    let typing_mutation_resolver =
        std::sync::Arc::new(crate::resolver::typing::mutation::TypingMutationResolver);

    tracing::debug!("Building schema: QueryRoot");
    let query_root = crate::query::QueryRoot {
        anki_query_resolver,
        bookmark_query_resolver,
        to_do_query_resolver,
        typing_query_resolver,
    };

    tracing::debug!("Building schema: MutationRoot");
    let mutation_root = crate::mutation::MutationRoot {
        anki_mutation_resolver,
        bookmark_mutation_resolver,
        to_do_mutation_resolver,
        typing_mutation_resolver,
    };

    tracing::debug!("Building schema: Schema");
    Ok(Schema::build(query_root, mutation_root, EmptySubscription)
        .data(anki_service)
        .data(bookmark_service)
        .data(to_do_service)
        .data(typing_service)
        .finish())
}

pub async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    let schema = match SCHEMA.get_or_try_init(try_init_schema).await {
        Ok(schema) => schema,
        Err(err) => {
            return Ok(Response::builder()
                .status(500)
                .header("content-type", "application/json")
                .body(
                    serde_json::json!({"error": format!("Failed to initialize schema: {}", err)})
                        .to_string()
                        .into(),
                )
                .map_err(Box::new)?);
        }
    };

    tracing::debug!("Lambda function triggered");

    if event.method() == Method::GET {
        let playground_html = GraphiQLSource::build().endpoint("/api/graphql").finish();
        let response = Response::builder()
            .status(200)
            .header("content-type", "text/html")
            .body(playground_html.into())
            .map_err(Box::new)?;
        Ok(response)
    } else if event.method() == Method::POST {
        let request_body = event.body();

        let gql_request = match serde_json::from_slice::<async_graphql::Request>(request_body) {
            Ok(request) => request,
            Err(err) => {
                return Ok(Response::builder()
                    .status(400)
                    .header("content-type", "application/json")
                    .body(
                        serde_json::json!({"error": format!("Invalid request body: {}", err)})
                            .to_string()
                            .into(),
                    )
                    .map_err(Box::new)?);
            }
        };

        let gql_response = schema.execute(gql_request).await;

        let response_body = match serde_json::to_string(&gql_response) {
            Ok(body) => body,
            Err(err) => {
                return Ok(Response::builder()
                    .status(500)
                    .header("content-type", "application/json")
                    .body(
                        serde_json::json!({"error": format!("Failed to serialize response: {}", err)})
                            .to_string()
                            .into(),
                    )
                    .map_err(Box::new)?);
            }
        };

        Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(response_body.into())
            .map_err(Box::new)?)
    } else {
        let response = Response::builder()
            .status(405)
            .header("content-type", "application/json")
            .body(
                serde_json::json!({"error": "Method Not Allowed"})
                    .to_string()
                    .into(),
            )
            .map_err(Box::new)?;
        Ok(response)
    }
}
