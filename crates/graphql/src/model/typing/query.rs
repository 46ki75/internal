#[derive(Default)]
pub struct TypingQuery;

#[async_graphql::Object]
impl TypingQuery {
    pub async fn typing(
        &self,
        _ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<super::Typing>, async_graphql::Error> {
        dotenvy::dotenv().ok();

        let environment = std::env::var("ENVIRONMENT")?;

        let table_name = format!("{environment}-table");

        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let client = aws_sdk_dynamodb::Client::new(&config);

        let request = client
            .query()
            .table_name(table_name)
            .key_condition_expression("PK = :pk")
            .expression_attribute_values(
                ":pk",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            );

        let response = request.send().await?;

        println!("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

        let items = response.items.ok_or("No items found")?;

        println!("{:?}", items);

        let typings = items
            .iter()
            .map(|item| {
                let id = item
                    .get("SK")
                    .ok_or("No SK found")?
                    .as_s()
                    .map_err(|_| async_graphql::Error::from("SK is not String"))?
                    .to_string();

                let text = item
                    .get("text")
                    .ok_or("No text found")?
                    .as_s()
                    .map_err(|_| async_graphql::Error::from("text is not String"))?
                    .to_string();

                let description = item
                    .get("description")
                    .ok_or("No description found")?
                    .as_s()
                    .map_err(|_| async_graphql::Error::from("description is not String"))?
                    .to_string();

                Ok(crate::model::typing::Typing {
                    id,
                    text,
                    description,
                })
            })
            .collect::<Result<Vec<super::Typing>, async_graphql::Error>>()?;

        Ok(typings)
    }
}
