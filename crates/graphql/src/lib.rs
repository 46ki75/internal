pub mod error;
pub mod model;
pub mod mutation;
pub mod query;
pub mod repository;
pub mod resolver;
pub mod service;
pub mod util;

use async_graphql::{http::GraphiQLSource, EmptySubscription, Schema};
use lambda_http::{http::Method, Body, Error, Request, Response};
use serde_json::json;

pub async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    log::debug!("Starting Lambda function");

    dotenvy::dotenv().ok();

    std::env::var("NOTION_API_KEY").map_err(|_| Error::from("NOTION_API_KEY not found"))?;

    log::debug!("Injecting dependencies: Anki");
    let anki_repository = std::sync::Arc::new(crate::repository::anki::AnkiRepositoryImpl);
    let anki_service = std::sync::Arc::new(crate::service::anki::AnkiService { anki_repository });
    let anki_query_resolver = std::sync::Arc::new(crate::resolver::anki::query::AnkiQueryResolver);
    let anki_mutation_resolver =
        std::sync::Arc::new(crate::resolver::anki::mutation::AnkiMutationResolver);

    log::debug!("Injecting dependencies: Bookmark");
    let bookmark_repository =
        std::sync::Arc::new(crate::repository::bookmark::BookmarkRepositoryImpl);
    let bookmark_service = std::sync::Arc::new(crate::service::bookmark::BookmarkService {
        bookmark_repository,
    });
    let bookmark_query_resolver =
        std::sync::Arc::new(crate::resolver::bookmark::query::BookmarkQueryResolver);

    log::debug!("Building schema: QueryRoot");
    let query_root = crate::query::QueryRoot {
        anki_query_resolver,
        bookmark_query_resolver,
    };

    log::debug!("Building schema: MutationRoot");
    let mutation_root = crate::mutation::MutationRoot {
        anki_mutation_resolver,
    };

    log::debug!("Building schema: Schema");
    let schema = Schema::build(query_root, mutation_root, EmptySubscription)
        .data(event.headers().clone())
        .data(anki_service)
        .data(bookmark_service)
        .finish();

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
                        json!({"error": format!("Invalid request body: {}", err)})
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
                        json!({"error": format!("Failed to serialize response: {}", err)})
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
            .body(json!({"error":"Method Not Allowed"}).to_string().into())
            .map_err(Box::new)?;
        Ok(response)
    }
}
