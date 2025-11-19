use super::dto::*;

#[async_trait::async_trait]
pub trait TypingRepository {
    async fn typing_list(&self) -> Result<Vec<TypingDto>, crate::error::Error>;

    async fn upsert_typing(
        &self,
        id: String,
        text: String,
        description: String,
    ) -> Result<TypingDto, crate::error::Error>;

    async fn delete_typing(&self, id: String) -> Result<TypingDto, crate::error::Error>;
}

pub struct TypingRepositoryImpl {}

#[async_trait::async_trait]
impl TypingRepository for TypingRepositoryImpl {
    async fn typing_list(&self) -> Result<Vec<TypingDto>, crate::error::Error> {
        let stage_name = crate::cache::get_or_init_stage_name().await?;

        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");

        let dynamodb_client = crate::cache::get_or_init_dynamodb_client().await;

        let request = dynamodb_client
            .query()
            .table_name(table_name)
            .key_condition_expression("PK = :pk")
            .expression_attribute_values(
                ":pk",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            );

        tracing::debug!("Sending request to DynamoDB: typing_list");
        let response = request
            .send()
            .await
            .map_err(|e| crate::error::Error::DynamoDb(e.to_string()))?;

        let items = TypingRecords::try_from(response)?.0;

        Ok(items)
    }

    async fn upsert_typing(
        &self,
        id: String,
        text: String,
        description: String,
    ) -> Result<TypingDto, crate::error::Error> {
        let stage_name = crate::cache::get_or_init_stage_name().await?;

        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");

        let dynamodb_client = crate::cache::get_or_init_dynamodb_client().await;

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

        tracing::debug!("Sending request to DynamoDB: upsert_typing");
        let _response = request
            .send()
            .await
            .map_err(|e| crate::error::Error::DynamoDb(e.to_string()))?;

        Ok(TypingDto {
            id,
            text,
            description,
        })
    }

    async fn delete_typing(&self, id: String) -> Result<TypingDto, crate::error::Error> {
        let stage_name = crate::cache::get_or_init_stage_name().await?;

        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");

        let dynamodb_client = crate::cache::get_or_init_dynamodb_client().await;

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

        tracing::debug!("Sending request to DynamoDB: delete_typing");
        let _response = request
            .send()
            .await
            .map_err(|e| crate::error::Error::DynamoDb(e.to_string()))?;

        Ok(TypingDto {
            id,
            text: "".to_string(),
            description: "".to_string(),
        })
    }
}

pub struct TypingRepositoryStub;

#[async_trait::async_trait]
impl TypingRepository for TypingRepositoryStub {
    async fn typing_list(&self) -> Result<Vec<TypingDto>, crate::error::Error> {
        Ok(vec![
            TypingDto {
                id: "93165a44-43c8-4790-84ad-08de54ec549a".to_string(),
                text: "text".to_string(),
                description: "description".to_string(),
            },
            TypingDto {
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
    ) -> Result<TypingDto, crate::error::Error> {
        Ok(TypingDto {
            id: "680008c4-d898-4202-8102-137cd9256595".to_string(),
            text: "text".to_string(),
            description: "description".to_string(),
        })
    }

    async fn delete_typing(&self, _id: String) -> Result<TypingDto, crate::error::Error> {
        Ok(TypingDto {
            id: "680008c4-d898-4202-8102-137cd9256595".to_string(),
            text: "text".to_string(),
            description: "description".to_string(),
        })
    }
}
