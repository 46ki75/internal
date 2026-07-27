pub mod input;
pub mod output;

use self::output::*;

#[derive(Debug, thiserror::Error)]
pub enum TypingRepositoryError {
    #[error("DynamoDB error: {0}")]
    DynamoDb(String),
    #[error("DynamoDB item not found: {0}")]
    DynamoDbNoItems(String),
    #[error("DynamoDB type mismatch: {0}")]
    DynamoDbType(String),
    #[error("typing item not found: {0}")]
    NotFound(String),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

#[async_trait::async_trait]
pub trait TypingRepository {
    async fn typing_list(&self) -> Result<Vec<TypingDto>, TypingRepositoryError>;

    async fn upsert_typing(
        &self,
        id: String,
        text: String,
        description: String,
    ) -> Result<TypingDto, TypingRepositoryError>;

    async fn delete_typing(&self, id: String) -> Result<TypingDto, TypingRepositoryError>;

    async fn complete_typing(&self, id: String) -> Result<TypingDto, TypingRepositoryError>;
}

pub struct TypingRepositoryImpl {}

fn append_typing_page(
    items: &mut Vec<TypingDto>,
    page: aws_sdk_dynamodb::operation::query::QueryOutput,
) -> Result<(), TypingRepositoryError> {
    items.extend(TypingRecords::try_from(page)?.0);
    Ok(())
}

#[async_trait::async_trait]
impl TypingRepository for TypingRepositoryImpl {
    async fn typing_list(&self) -> Result<Vec<TypingDto>, TypingRepositoryError> {
        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;

        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");

        let dynamodb_client = http_api_core::cache::get_or_init_dynamodb_client().await;

        let request = dynamodb_client
            .query()
            .table_name(table_name)
            .key_condition_expression("PK = :pk")
            .expression_attribute_values(
                ":pk",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            );

        tracing::debug!("Sending request to DynamoDB: typing_list");
        let mut pages = request.into_paginator().send();
        let mut items = Vec::new();

        while let Some(page) = pages.next().await {
            let page = page.map_err(|e| TypingRepositoryError::DynamoDb(e.to_string()))?;
            append_typing_page(&mut items, page)?;
        }

        Ok(items)
    }

    async fn upsert_typing(
        &self,
        id: String,
        text: String,
        description: String,
    ) -> Result<TypingDto, TypingRepositoryError> {
        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;

        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");

        let dynamodb_client = http_api_core::cache::get_or_init_dynamodb_client().await;

        let request = dynamodb_client
            .update_item()
            .table_name(table_name)
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            )
            .key(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S(id.to_string()),
            )
            .update_expression(
                "SET #text = :text, #description = :description, completion_count = if_not_exists(completion_count, :zero)",
            )
            .expression_attribute_names("#text", "text")
            .expression_attribute_names("#description", "description")
            .expression_attribute_values(
                ":text",
                aws_sdk_dynamodb::types::AttributeValue::S(text.to_string()),
            )
            .expression_attribute_values(
                ":description",
                aws_sdk_dynamodb::types::AttributeValue::S(description.to_string()),
            )
            .expression_attribute_values(
                ":zero",
                aws_sdk_dynamodb::types::AttributeValue::N("0".to_string()),
            )
            .return_values(aws_sdk_dynamodb::types::ReturnValue::AllNew);

        tracing::debug!("Sending request to DynamoDB: upsert_typing");
        let response = request
            .send()
            .await
            .map_err(|e| TypingRepositoryError::DynamoDb(e.to_string()))?;

        TypingDto::try_from(response)
    }

    async fn delete_typing(&self, id: String) -> Result<TypingDto, TypingRepositoryError> {
        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;

        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");

        let dynamodb_client = http_api_core::cache::get_or_init_dynamodb_client().await;

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
            .map_err(|e| TypingRepositoryError::DynamoDb(e.to_string()))?;

        Ok(TypingDto {
            id,
            text: "".to_string(),
            description: "".to_string(),
            completion_count: 0,
        })
    }

    async fn complete_typing(&self, id: String) -> Result<TypingDto, TypingRepositoryError> {
        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let table_name = format!("{stage_name}-46ki75-internal-dynamodb-table");
        let dynamodb_client = http_api_core::cache::get_or_init_dynamodb_client().await;

        tracing::debug!(typing_id = %id, "Sending request to DynamoDB: complete_typing");
        let response = dynamodb_client
            .update_item()
            .table_name(table_name)
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("Typing#")),
            )
            .key("SK", aws_sdk_dynamodb::types::AttributeValue::S(id.clone()))
            .update_expression("ADD completion_count :increment")
            .condition_expression("attribute_exists(#pk) AND attribute_exists(#sk)")
            .expression_attribute_names("#pk", "PK")
            .expression_attribute_names("#sk", "SK")
            .expression_attribute_values(
                ":increment",
                aws_sdk_dynamodb::types::AttributeValue::N("1".to_string()),
            )
            .return_values(aws_sdk_dynamodb::types::ReturnValue::AllNew)
            .send()
            .await
            .map_err(|error| {
                if error
                    .as_service_error()
                    .is_some_and(|error| error.is_conditional_check_failed_exception())
                {
                    TypingRepositoryError::NotFound(id.clone())
                } else {
                    TypingRepositoryError::DynamoDb(error.to_string())
                }
            })?;

        TypingDto::try_from(response)
    }
}

pub struct TypingRepositoryStub;

#[async_trait::async_trait]
impl TypingRepository for TypingRepositoryStub {
    async fn typing_list(&self) -> Result<Vec<TypingDto>, TypingRepositoryError> {
        Ok(vec![
            TypingDto {
                id: "93165a44-43c8-4790-84ad-08de54ec549a".to_string(),
                text: "text".to_string(),
                description: "description".to_string(),
                completion_count: 2,
            },
            TypingDto {
                id: "13479686-da77-47c7-9fb2-858002c6c9bf".to_string(),
                text: "text".to_string(),
                description: "description".to_string(),
                completion_count: 0,
            },
        ])
    }

    async fn upsert_typing(
        &self,
        _id: String,
        _text: String,
        _description: String,
    ) -> Result<TypingDto, TypingRepositoryError> {
        Ok(TypingDto {
            id: "680008c4-d898-4202-8102-137cd9256595".to_string(),
            text: "text".to_string(),
            description: "description".to_string(),
            completion_count: 0,
        })
    }

    async fn delete_typing(&self, _id: String) -> Result<TypingDto, TypingRepositoryError> {
        Ok(TypingDto {
            id: "680008c4-d898-4202-8102-137cd9256595".to_string(),
            text: "text".to_string(),
            description: "description".to_string(),
            completion_count: 0,
        })
    }

    async fn complete_typing(&self, id: String) -> Result<TypingDto, TypingRepositoryError> {
        if id == "missing" {
            return Err(TypingRepositoryError::NotFound(id));
        }

        Ok(TypingDto {
            id,
            text: "text".to_string(),
            description: "description".to_string(),
            completion_count: 1,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aws_sdk_dynamodb::{operation::query::QueryOutput, types::AttributeValue};
    use std::collections::HashMap;

    fn page(id: &str, completion_count: Option<u64>) -> QueryOutput {
        let mut item = HashMap::from([
            ("SK".to_string(), AttributeValue::S(id.to_string())),
            ("text".to_string(), AttributeValue::S(format!("text-{id}"))),
            (
                "description".to_string(),
                AttributeValue::S(format!("description-{id}")),
            ),
        ]);
        if let Some(completion_count) = completion_count {
            item.insert(
                "completion_count".to_string(),
                AttributeValue::N(completion_count.to_string()),
            );
        }
        QueryOutput::builder().items(item).build()
    }

    #[test]
    fn appends_records_from_each_query_page() {
        let mut records = Vec::new();

        append_typing_page(&mut records, page("first", None)).unwrap();
        append_typing_page(&mut records, page("second", Some(3))).unwrap();

        assert_eq!(records[0].completion_count, 0);
        assert_eq!(records[1].completion_count, 3);
        assert_eq!(
            records
                .into_iter()
                .map(|record| record.id)
                .collect::<Vec<_>>(),
            ["first", "second"]
        );
    }
}
