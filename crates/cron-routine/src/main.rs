use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

async fn function_handler(_event: LambdaEvent<EventBridgeEvent>) -> Result<(), Error> {
    dotenvy::dotenv().ok();

    let secret = std::env::var("NOTION_API_KEY")?;

    let database_id = std::env::var("NOTION_ROUTINE_DATABASE_ID")?;

    let client = notionrs::Client::new().secret(secret);

    let filter = notionrs::filter::Filter::checkbox_is_checked("IsDone");

    let request = client
        .query_database()
        .database_id(database_id)
        .filter(filter);

    let response = request.send().await?;

    let routine_ids = response
        .results
        .into_iter()
        .map(|page| page.id)
        .collect::<Vec<String>>();

    for id in routine_ids {
        let mut properties = std::collections::HashMap::new();

        properties.insert(
            "IsDone".to_string(),
            notionrs::page::properties::PageProperty::Checkbox(
                notionrs::page::PageCheckboxProperty::from(false),
            ),
        );

        let request = client.update_page().page_id(id).properties(properties);

        let _response = request.send().await?;
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
