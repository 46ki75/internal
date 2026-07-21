use std::collections::HashMap;

use aws_sdk_dynamodb::types::{AttributeValue, ReturnValue};

use super::{AssessmentPersistence, PersistenceError};
use crate::use_case::domain::Assessment;

const PARTITION_KEY: &str = "WritingAssessment#";

pub struct DynamoDbAssessmentPersistence;

async fn table_name() -> Result<String, PersistenceError> {
    let stage = http_api_core::cache::get_or_init_stage_name().await?;
    Ok(format!("{stage}-46ki75-internal-dynamodb-table"))
}

fn assessment_from_item(
    item: &HashMap<String, AttributeValue>,
) -> Result<Assessment, PersistenceError> {
    let data = item
        .get("data")
        .and_then(|value| value.as_s().ok())
        .ok_or_else(|| PersistenceError::InvalidData("missing string attribute data".into()))?;
    serde_json::from_str(data).map_err(|error| PersistenceError::InvalidData(error.to_string()))
}

#[async_trait::async_trait]
impl AssessmentPersistence for DynamoDbAssessmentPersistence {
    async fn list(&self) -> Result<Vec<Assessment>, PersistenceError> {
        let response = http_api_core::cache::get_or_init_dynamodb_client()
            .await
            .query()
            .table_name(table_name().await?)
            .key_condition_expression("PK = :pk")
            .expression_attribute_values(":pk", AttributeValue::S(PARTITION_KEY.into()))
            .scan_index_forward(false)
            .send()
            .await
            .map_err(|error| PersistenceError::DynamoDb(error.to_string()))?;

        response
            .items
            .unwrap_or_default()
            .iter()
            .map(assessment_from_item)
            .collect()
    }

    async fn get(&self, id: &str) -> Result<Assessment, PersistenceError> {
        let response = http_api_core::cache::get_or_init_dynamodb_client()
            .await
            .get_item()
            .table_name(table_name().await?)
            .key("PK", AttributeValue::S(PARTITION_KEY.into()))
            .key("SK", AttributeValue::S(id.into()))
            .send()
            .await
            .map_err(|error| PersistenceError::DynamoDb(error.to_string()))?;
        let item = response
            .item
            .ok_or_else(|| PersistenceError::NotFound(id.into()))?;
        assessment_from_item(&item)
    }

    async fn put(&self, assessment: &Assessment) -> Result<(), PersistenceError> {
        let data = serde_json::to_string(assessment)
            .map_err(|error| PersistenceError::InvalidData(error.to_string()))?;
        http_api_core::cache::get_or_init_dynamodb_client()
            .await
            .put_item()
            .table_name(table_name().await?)
            .item("PK", AttributeValue::S(PARTITION_KEY.into()))
            .item("SK", AttributeValue::S(assessment.id.clone()))
            .item("data", AttributeValue::S(data))
            .send()
            .await
            .map_err(|error| PersistenceError::DynamoDb(error.to_string()))?;
        Ok(())
    }

    async fn delete(&self, id: &str) -> Result<Assessment, PersistenceError> {
        let response = http_api_core::cache::get_or_init_dynamodb_client()
            .await
            .delete_item()
            .table_name(table_name().await?)
            .key("PK", AttributeValue::S(PARTITION_KEY.into()))
            .key("SK", AttributeValue::S(id.into()))
            .return_values(ReturnValue::AllOld)
            .send()
            .await
            .map_err(|error| PersistenceError::DynamoDb(error.to_string()))?;
        let item = response
            .attributes
            .ok_or_else(|| PersistenceError::NotFound(id.into()))?;
        assessment_from_item(&item)
    }
}
