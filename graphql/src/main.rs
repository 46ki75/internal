use juniper::{http::graphiql::graphiql_source, EmptySubscription, RootNode};
use lambda_http::{http::Method, run, service_fn, tracing, Body, Error, Request, Response};

mod query;
use query::Query;

mod mutation;
use mutation::Mutation;

mod context;
use context::GraphQLContext;

type Schema = RootNode<'static, Query, Mutation, EmptySubscription<GraphQLContext>>;

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    if event.method() == Method::GET {
        let html = graphiql_source("", None);
        Ok(Response::builder()
            .status(200)
            .header("content-type", "text/html")
            .body(Body::Text(html))
            .map_err(Box::new)?)
    } else if event.method() == Method::POST {
        let schema = Schema::new(Query, Mutation, EmptySubscription::new());

        let request_headers = event.headers().clone();
        let context = GraphQLContext::new(request_headers);

        let request_body = event.body().as_ref();
        let request: juniper::http::GraphQLRequest = serde_json::from_slice(request_body)?;

        let response = request.execute(&schema, &context).await;
        let response_body = serde_json::to_string(&response)?;

        let response_body_builder = Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(Body::Text(response_body));

        Ok(response_body_builder.map_err(Box::new)?)
    } else {
        Ok(Response::builder()
            .status(405)
            .body(Body::Text("Method Not Allowed".to_string()))
            .map_err(Box::new)?)
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();
    run(service_fn(function_handler)).await
}
