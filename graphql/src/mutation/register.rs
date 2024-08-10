use juniper::{graphql_object, FieldError};

use crate::context::GraphQLContext;

use bcrypt;

use aws_config::{BehaviorVersion, Region};
use aws_sdk_dynamodb::{types::AttributeValue, Client};

pub(crate) struct RegisterMutation {
    status: String,
    username: String,
}

impl RegisterMutation {
    pub(crate) async fn new(
        context: &GraphQLContext,
        username: String,
        password: String,
    ) -> Result<Self, FieldError> {
        let region = Region::new("ap-northeast-1");
        let config = aws_config::defaults(BehaviorVersion::latest())
            .region(region)
            .load()
            .await;
        let client = Client::new(&config);

        let request = client
            .get_item()
            .table_name("primary-table")
            .key("PK", AttributeValue::S(format!("USER#{}#", username)))
            .key("SK", AttributeValue::S(String::from("PROFILE#")));

        let response = request.send().await.map_err(|_| {
            FieldError::new(
                "A database error occurred while retrieving user information.",
                juniper::Value::Null,
            )
        })?;

        if response.item.is_some() {
            return Err(FieldError::new(
                "The user already exists. Please try a different username.",
                juniper::Value::Null,
            ));
        }

        let hashed_password = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();

        let request = client
            .put_item()
            .table_name("primary-table")
            .item("PK", AttributeValue::S(format!("USER#{}#", username)))
            .item("SK", AttributeValue::S(String::from("PROFILE#")))
            .item("password", AttributeValue::S(hashed_password.clone()))
            .item(
                "groups",
                AttributeValue::L(vec![AttributeValue::S(String::from("BASIC"))]),
            );

        let response = request.send().await;

        match response {
            Ok(_) => Ok(RegisterMutation {
                status: "SUCCESS".to_string(),
                username: hashed_password,
            }),
            Err(_) => Err(FieldError::new(
                "An error occurred when registering the user in the database.",
                juniper::Value::null(),
            )),
        }
    }
}

#[graphql_object]
impl RegisterMutation {
    pub fn status(&self) -> &str {
        &self.status
    }

    pub fn username(&self) -> &str {
        &self.username
    }
}
