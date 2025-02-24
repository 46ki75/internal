pub struct TypingRecord {
    pub id: String,
    pub text: String,
    pub description: String,
}

impl TryFrom<aws_sdk_dynamodb::operation::put_item::PutItemOutput> for TypingRecord {
    type Error = crate::error::Error;

    fn try_from(
        value: aws_sdk_dynamodb::operation::put_item::PutItemOutput,
    ) -> Result<Self, Self::Error> {
        let item = value
            .attributes
            .ok_or(crate::error::Error::DynamoDbNoItems(
                "No items found".to_string(),
            ))?;

        let id = item
            .get("SK")
            .ok_or(crate::error::Error::DynamoDbNoItems(
                "No SK found".to_string(),
            ))?
            .as_s()
            .map_err(|_| crate::error::Error::DynamoDbType("SK is not String".to_string()))?
            .to_string();

        let text = item
            .get("text")
            .ok_or(crate::error::Error::DynamoDbNoItems(
                "No text found".to_string(),
            ))?
            .as_s()
            .map_err(|_| crate::error::Error::DynamoDbType("text is not String".to_string()))?
            .to_string();

        let description = item
            .get("description")
            .ok_or(crate::error::Error::DynamoDbNoItems(
                "No description found".to_string(),
            ))?
            .as_s()
            .map_err(|_| {
                crate::error::Error::DynamoDbType("description is not String".to_string())
            })?
            .to_string();

        Ok(TypingRecord {
            id,
            text,
            description,
        })
    }
}

pub struct TypingRecords(pub Vec<TypingRecord>);

impl TryFrom<aws_sdk_dynamodb::operation::query::QueryOutput> for TypingRecords {
    type Error = crate::error::Error;

    fn try_from(
        value: aws_sdk_dynamodb::operation::query::QueryOutput,
    ) -> Result<Self, Self::Error> {
        let items = value.items.ok_or(crate::error::Error::DynamoDbNoItems(
            "No items found".to_string(),
        ))?;

        let records = items
            .into_iter()
            .map(|item| {
                let id = item
                    .get("SK")
                    .ok_or(crate::error::Error::DynamoDbNoItems(
                        "No SK found".to_string(),
                    ))?
                    .as_s()
                    .map_err(|_| crate::error::Error::DynamoDbType("SK is not String".to_string()))?
                    .to_string();

                let text = item
                    .get("text")
                    .ok_or(crate::error::Error::DynamoDbNoItems(
                        "No text found".to_string(),
                    ))?
                    .as_s()
                    .map_err(|_| {
                        crate::error::Error::DynamoDbType("text is not String".to_string())
                    })?
                    .to_string();

                let description = item
                    .get("description")
                    .ok_or(crate::error::Error::DynamoDbNoItems(
                        "No description found".to_string(),
                    ))?
                    .as_s()
                    .map_err(|_| {
                        crate::error::Error::DynamoDbType("description is not String".to_string())
                    })?
                    .to_string();

                Ok(TypingRecord {
                    id,
                    text,
                    description,
                })
            })
            .collect::<Result<Vec<TypingRecord>, crate::error::Error>>()?;

        Ok(TypingRecords(records))
    }
}
