pub struct TypingDto {
    pub id: String,
    pub text: String,
    pub description: String,
}

impl TryFrom<aws_sdk_dynamodb::operation::put_item::PutItemOutput> for TypingDto {
    type Error = crate::typing::repository::TypingRepositoryError;

    fn try_from(
        value: aws_sdk_dynamodb::operation::put_item::PutItemOutput,
    ) -> Result<Self, Self::Error> {
        use crate::typing::repository::TypingRepositoryError;

        let item = value
            .attributes
            .ok_or(TypingRepositoryError::DynamoDbNoItems(
                "No items found".to_string(),
            ))?;

        let id = item
            .get("SK")
            .ok_or(TypingRepositoryError::DynamoDbNoItems(
                "No SK found".to_string(),
            ))?
            .as_s()
            .map_err(|_| TypingRepositoryError::DynamoDbType("SK is not String".to_string()))?
            .to_string();

        let text = item
            .get("text")
            .ok_or(TypingRepositoryError::DynamoDbNoItems(
                "No text found".to_string(),
            ))?
            .as_s()
            .map_err(|_| TypingRepositoryError::DynamoDbType("text is not String".to_string()))?
            .to_string();

        let description = item
            .get("description")
            .ok_or(TypingRepositoryError::DynamoDbNoItems(
                "No description found".to_string(),
            ))?
            .as_s()
            .map_err(|_| {
                TypingRepositoryError::DynamoDbType("description is not String".to_string())
            })?
            .to_string();

        Ok(TypingDto {
            id,
            text,
            description,
        })
    }
}

pub struct TypingRecords(pub Vec<TypingDto>);

impl TryFrom<aws_sdk_dynamodb::operation::query::QueryOutput> for TypingRecords {
    type Error = crate::typing::repository::TypingRepositoryError;

    fn try_from(
        value: aws_sdk_dynamodb::operation::query::QueryOutput,
    ) -> Result<Self, Self::Error> {
        use crate::typing::repository::TypingRepositoryError;

        let items = value
            .items
            .ok_or(TypingRepositoryError::DynamoDbNoItems(
                "No items found".to_string(),
            ))?;

        let records = items
            .into_iter()
            .map(|item| {
                let id = item
                    .get("SK")
                    .ok_or(TypingRepositoryError::DynamoDbNoItems(
                        "No SK found".to_string(),
                    ))?
                    .as_s()
                    .map_err(|_| {
                        TypingRepositoryError::DynamoDbType("SK is not String".to_string())
                    })?
                    .to_string();

                let text = item
                    .get("text")
                    .ok_or(TypingRepositoryError::DynamoDbNoItems(
                        "No text found".to_string(),
                    ))?
                    .as_s()
                    .map_err(|_| {
                        TypingRepositoryError::DynamoDbType("text is not String".to_string())
                    })?
                    .to_string();

                let description = item
                    .get("description")
                    .ok_or(TypingRepositoryError::DynamoDbNoItems(
                        "No description found".to_string(),
                    ))?
                    .as_s()
                    .map_err(|_| {
                        TypingRepositoryError::DynamoDbType(
                            "description is not String".to_string(),
                        )
                    })?
                    .to_string();

                Ok(TypingDto {
                    id,
                    text,
                    description,
                })
            })
            .collect::<Result<Vec<TypingDto>, TypingRepositoryError>>()?;

        Ok(TypingRecords(records))
    }
}
