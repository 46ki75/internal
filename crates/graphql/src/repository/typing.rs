#[async_trait::async_trait]
pub trait TypingRepository {
    async fn typing_list(
        &self,
    ) -> Result<Vec<crate::record::typing::TypingRecord>, crate::error::Error>;

    async fn upsert_typing(
        &self,
        id: String,
        text: String,
        description: String,
    ) -> Result<crate::record::typing::TypingRecord, crate::error::Error>;

    async fn delete_typing(
        &self,
        id: String,
    ) -> Result<crate::record::typing::TypingRecord, crate::error::Error>;
}

pub struct TypingRepositoryImpl {
    pub config: std::sync::Arc<crate::config::Config>,
}

#[async_trait::async_trait]
impl TypingRepository for TypingRepositoryImpl {
    async fn typing_list(
        &self,
    ) -> Result<Vec<crate::record::typing::TypingRecord>, crate::error::Error> {
        let environment = self.config.environment.as_str();

        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);

        let table_name = format!("{environment}-46ki75-internal-dynamodb-table");

        let request = dynamodb_client
            .query()
            .table_name(table_name)
            .key_condition_expression("PK = :pk")
            .expression_attribute_values(
                ":pk",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            );

        let response = request
            .send()
            .await
            .map_err(|e| crate::error::Error::DynamoDb(e.to_string()))?;

        let items = crate::record::typing::TypingRecords::try_from(response)?.0;

        Ok(items)
    }

    async fn upsert_typing(
        &self,
        id: String,
        text: String,
        description: String,
    ) -> Result<crate::record::typing::TypingRecord, crate::error::Error> {
        let environment = self.config.environment.as_str();

        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);

        let table_name = format!("{environment}-46ki75-internal-dynamodb-table");

        let request = dynamodb_client
            .put_item()
            .table_name(table_name)
            .item(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            )
            .item(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S(id.to_string()),
            )
            .item(
                "text",
                aws_sdk_dynamodb::types::AttributeValue::S(text.to_string()),
            )
            .item(
                "description",
                aws_sdk_dynamodb::types::AttributeValue::S(description.to_string()),
            );

        let _response = request
            .send()
            .await
            .map_err(|e| crate::error::Error::DynamoDb(e.to_string()))?;

        Ok(crate::record::typing::TypingRecord {
            id,
            text,
            description,
        })
    }

    async fn delete_typing(
        &self,
        id: String,
    ) -> Result<crate::record::typing::TypingRecord, crate::error::Error> {
        let environment = self.config.environment.as_str();

        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);

        let table_name = format!("{environment}-46ki75-internal-dynamodb-table");

        let request = dynamodb_client
            .delete_item()
            .table_name(table_name)
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            )
            .key(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S(id.to_string()),
            );

        let _response = request
            .send()
            .await
            .map_err(|e| crate::error::Error::DynamoDb(e.to_string()))?;

        Ok(crate::record::typing::TypingRecord {
            id,
            text: "".to_string(),
            description: "".to_string(),
        })
    }
}

pub struct TypingRepositoryStub;

#[async_trait::async_trait]
impl TypingRepository for TypingRepositoryStub {
    async fn typing_list(
        &self,
    ) -> Result<Vec<crate::record::typing::TypingRecord>, crate::error::Error> {
        Ok(vec![
            crate::record::typing::TypingRecord {
                id: "93165a44-43c8-4790-84ad-08de54ec549a".to_string(),
                text: "text".to_string(),
                description: "description".to_string(),
            },
            crate::record::typing::TypingRecord {
                id: "13479686-da77-47c7-9fb2-858002c6c9bf".to_string(),
                text: "text".to_string(),
                description: "description".to_string(),
            },
        ])
    }

    async fn upsert_typing(
        &self,
        _id: String,
        _text: String,
        _description: String,
    ) -> Result<crate::record::typing::TypingRecord, crate::error::Error> {
        Ok(crate::record::typing::TypingRecord {
            id: "680008c4-d898-4202-8102-137cd9256595".to_string(),
            text: "text".to_string(),
            description: "description".to_string(),
        })
    }

    async fn delete_typing(
        &self,
        _id: String,
    ) -> Result<crate::record::typing::TypingRecord, crate::error::Error> {
        Ok(crate::record::typing::TypingRecord {
            id: "680008c4-d898-4202-8102-137cd9256595".to_string(),
            text: "text".to_string(),
            description: "description".to_string(),
        })
    }
}
