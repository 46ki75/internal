use std::collections::HashMap;

use aws_sdk_dynamodb::types::AttributeValue;

pub struct TypingDto {
    pub id: String,
    pub text: String,
    pub description: String,
    pub completion_count: u64,
}

fn typing_from_item(
    item: HashMap<String, AttributeValue>,
) -> Result<TypingDto, crate::repository::TypingRepositoryError> {
    use crate::repository::TypingRepositoryError;

    let required_string = |name: &str| {
        item.get(name)
            .ok_or_else(|| TypingRepositoryError::DynamoDbNoItems(format!("No {name} found")))?
            .as_s()
            .map_err(|_| TypingRepositoryError::DynamoDbType(format!("{name} is not String")))
            .cloned()
    };
    let completion_count = match item.get("completion_count") {
        Some(value) => value
            .as_n()
            .map_err(|_| {
                TypingRepositoryError::DynamoDbType("completion_count is not Number".to_string())
            })?
            .parse::<u64>()
            .map_err(|_| {
                TypingRepositoryError::DynamoDbType(
                    "completion_count is not an unsigned integer".to_string(),
                )
            })?,
        None => 0,
    };

    Ok(TypingDto {
        id: required_string("SK")?,
        text: required_string("text")?,
        description: required_string("description")?,
        completion_count,
    })
}

impl TryFrom<aws_sdk_dynamodb::operation::put_item::PutItemOutput> for TypingDto {
    type Error = crate::repository::TypingRepositoryError;

    fn try_from(
        value: aws_sdk_dynamodb::operation::put_item::PutItemOutput,
    ) -> Result<Self, Self::Error> {
        let item =
            value
                .attributes
                .ok_or(crate::repository::TypingRepositoryError::DynamoDbNoItems(
                    "No items found".to_string(),
                ))?;
        typing_from_item(item)
    }
}

impl TryFrom<aws_sdk_dynamodb::operation::update_item::UpdateItemOutput> for TypingDto {
    type Error = crate::repository::TypingRepositoryError;

    fn try_from(
        value: aws_sdk_dynamodb::operation::update_item::UpdateItemOutput,
    ) -> Result<Self, Self::Error> {
        let item =
            value
                .attributes
                .ok_or(crate::repository::TypingRepositoryError::DynamoDbNoItems(
                    "No items found".to_string(),
                ))?;
        typing_from_item(item)
    }
}

pub struct TypingRecords(pub Vec<TypingDto>);

impl TryFrom<aws_sdk_dynamodb::operation::query::QueryOutput> for TypingRecords {
    type Error = crate::repository::TypingRepositoryError;

    fn try_from(
        value: aws_sdk_dynamodb::operation::query::QueryOutput,
    ) -> Result<Self, Self::Error> {
        use crate::repository::TypingRepositoryError;

        let items = value.items.ok_or(TypingRepositoryError::DynamoDbNoItems(
            "No items found".to_string(),
        ))?;

        let records = items
            .into_iter()
            .map(typing_from_item)
            .collect::<Result<Vec<TypingDto>, TypingRepositoryError>>()?;

        Ok(TypingRecords(records))
    }
}
