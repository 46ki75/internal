use juniper::{graphql_object, FieldError};

use crate::context::GraphQLContext;

use aws_config::{BehaviorVersion, Region};
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_ssm::Client;

pub(crate) struct LoginMutation {
    status: String,
    token: String,
}

impl LoginMutation {
    pub(crate) async fn new(
        context: &GraphQLContext,
        username: String,
        password: String,
    ) -> Result<Self, juniper::FieldError> {
        let region = Region::new("ap-northeast-1");
        let config = aws_config::defaults(BehaviorVersion::latest())
            .region(region)
            .load()
            .await;

        let client = aws_sdk_dynamodb::Client::new(&config);

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

        if response.item.is_none() {
            return Err(FieldError::new(
                "The user could not be found.",
                juniper::Value::Null,
            ));
        }

        let result = response.item.unwrap();
        let hashed_password = match result.get("password") {
            Some(v) => match v.as_s() {
                Ok(s) => s,
                Err(_) => {
                    return Err(FieldError::new(
                        "The password format is incorrect.",
                        juniper::Value::Null,
                    ))
                }
            },
            None => {
                return Err(FieldError::new(
                    "No password has been set.",
                    juniper::Value::Null,
                ))
            }
        };

        let is_valid = bcrypt::verify(password, hashed_password).unwrap();

        if is_valid {
            Ok(LoginMutation {
                status: "SUCCESS".to_string(),
                token: "".to_string(),
            })
        } else {
            Err(FieldError::new(
                "The password is incorrect.",
                juniper::Value::Null,
            ))
        }
    }
}

#[graphql_object]
impl LoginMutation {
    pub fn status(&self) -> &str {
        &self.status
    }

    pub fn token(&self) -> &str {
        &self.token
    }
}
