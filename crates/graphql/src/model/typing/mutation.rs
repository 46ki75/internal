#[derive(Default)]
pub struct TypingMutation;

#[derive(async_graphql::InputObject)]
pub struct TypingInput {
    pub text: String,
    pub description: String,
}

#[derive(async_graphql::InputObject)]
pub struct TypingDeleteInput {
    pub id: String,
}

#[async_graphql::Object]
impl TypingMutation {
    pub async fn upsert_typing(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: TypingInput,
    ) -> Result<super::Typing, async_graphql::Error> {
        dotenvy::dotenv().ok();

        let environment = std::env::var("ENVIRONMENT")?;

        let table_name = format!("{environment}-46ki75-internal-dynamodb-table");

        let TypingInput { text, description } = input;

        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let client = aws_sdk_dynamodb::Client::new(&config);

        let id = uuid::Uuid::new_v4().to_string();

        let request = client
            .put_item()
            .table_name(table_name)
            .item(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            )
            .item("SK", aws_sdk_dynamodb::types::AttributeValue::S(id.clone()))
            .item(
                "text",
                aws_sdk_dynamodb::types::AttributeValue::S(text.clone()),
            )
            .item(
                "description",
                aws_sdk_dynamodb::types::AttributeValue::S(description.clone()),
            );

        let _response = request.send().await?;

        Ok(super::Typing {
            id,
            text,
            description,
        })
    }

    pub async fn delete_typing(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: TypingDeleteInput,
    ) -> Result<String, async_graphql::Error> {
        dotenvy::dotenv().ok();

        let environment = std::env::var("ENVIRONMENT")?;

        let table_name = format!("{environment}-table");

        let TypingDeleteInput { id } = input;

        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let client = aws_sdk_dynamodb::Client::new(&config);

        let request = client
            .delete_item()
            .table_name(table_name)
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            )
            .key("SK", aws_sdk_dynamodb::types::AttributeValue::S(id.clone()));

        let _response = request.send().await?;

        Ok(id)
    }
}
