use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

use serde::{Deserialize, Serialize};

use aws_config::meta::region::RegionProviderChain;
use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::Client;

use rand::rngs::OsRng;
use rand::RngCore;

use chrono::prelude::*;

#[derive(Deserialize)]
struct Request {
    /// "access_token" or "refresh_token"
    kind: String,
}

#[derive(Serialize)]
struct Response {
    status: String,
}

async fn function_handler(event: LambdaEvent<Request>) -> Result<Response, Error> {
    let region_proider = RegionProviderChain::default_provider().or_else("ap-northeast-1");
    let config = aws_config::defaults(BehaviorVersion::latest())
        .region(region_proider)
        .load()
        .await;

    let client = Client::new(&config);

    let utc_now = Utc::now();
    let tokyo_offset = FixedOffset::east_opt(9 * 3600).unwrap();
    let tokyo_now = utc_now.with_timezone(&tokyo_offset);
    let ttl = tokyo_now + chrono::Duration::days(14);

    let mut secret_key = [0u8; 64];
    OsRng.fill_bytes(&mut secret_key);

    let request = client
        .put_item()
        .table_name("jwt-keystore")
        .item(
            "PK",
            aws_sdk_dynamodb::types::AttributeValue::S({
                if event.payload.kind == "access_token" {
                    String::from("JWT_ACCESS_SECRET#")
                } else if event.payload.kind == "refresh_token" {
                    String::from("JWT_REFRESH_SECRET#")
                } else {
                    panic!("Unexpected token type: {}", event.payload.kind)
                }
            }),
        )
        .item(
            "SK",
            aws_sdk_dynamodb::types::AttributeValue::S(tokyo_now.timestamp().to_string()),
        )
        .item(
            "TTL",
            aws_sdk_dynamodb::types::AttributeValue::N(ttl.timestamp().to_string()),
        )
        .item(
            "secret",
            aws_sdk_dynamodb::types::AttributeValue::S(hex::encode(secret_key)),
        );

    request.send().await?;

    let resp = Response {
        status: String::from("SUCCESS"),
    };

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
