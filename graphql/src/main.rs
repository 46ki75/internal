use async_graphql::{http::GraphiQLSource, EmptySubscription, Schema};
use lambda_http::{http::Method, run, service_fn, tracing, Body, Error, Request, Response};

mod context;
mod mutation;
mod query;
mod resolvers;
mod services;

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    // # --------------------------------------------------------------------------------
    //
    // Schema creation and context injection
    //
    // # --------------------------------------------------------------------------------

    let custom_context = context::CustomContext::new(event.clone());

    let schema = Schema::build(query::QueryRoot, mutation::MutationRoot, EmptySubscription)
        .data(event.headers().clone())
        .data(custom_context)
        .finish();

    if event.method() == Method::GET {
        // # --------------------------------------------------------------------------------
        //
        // playground
        //
        // # --------------------------------------------------------------------------------

        let playground_html = GraphiQLSource::build().endpoint("/graphql").finish();
        let response = Response::builder()
            .status(200)
            .header("content-type", "text/html")
            .body(playground_html.into())
            .map_err(Box::new)?;
        Ok(response)
    } else if event.method() == Method::POST {
        // # --------------------------------------------------------------------------------
        //
        // GraphQL API Execution
        //
        // # --------------------------------------------------------------------------------

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

        // Creating a Response in Lambda

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

        let mut response_builder = Response::builder()
            .status(200)
            .header("content-type", "application/json");

        // Inserting a Custom Header (Retrieved from Context)

        let response_header = gql_response.http_headers;

        for (key, value) in response_header {
            if let Some(name) = key {
                response_builder = response_builder.header(name, value);
            }
        }

        Ok(response_builder
            .body(response_body.into())
            .map_err(Box::new)?)
    } else {
        // # --------------------------------------------------------------------------------
        //
        // Handling Unauthorized Methods
        //
        // # --------------------------------------------------------------------------------

        let response = Response::builder()
            .status(405)
            .header("content-type", "application/json")
            .body(
                serde_json::json!({"error":"Method Not Allowed"})
                    .to_string()
                    .into(),
            )
            .map_err(Box::new)?;
        Ok(response)
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();
    run(service_fn(function_handler)).await
}
