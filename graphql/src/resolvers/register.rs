use lambda_http::tracing::subscriber::field::debug;

pub struct Register {
    pub username: String,
}

impl Register {
    pub async fn new(
        _: &async_graphql::Context<'_>,
        username: String,
        password: String,
    ) -> Result<Self, async_graphql::Error> {
        if username.is_empty() {
            return Err(async_graphql::FieldError::new(
                "The `username` field is empty.",
            ));
        }

        if !regex::Regex::new(r"^[a-zA-Z0-9_\-]+$")
            .unwrap()
            .is_match(&username)
        {
            return Err(async_graphql::FieldError::new(
                "Usernames can only contain alphanumeric characters.",
            ));
        }

        if password.is_empty() {
            return Err(async_graphql::FieldError::new(
                "The `password` field is empty.",
            ));
        }

        let region = aws_config::Region::from_static("ap-northeast-1");
        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region)
            .load()
            .await;

        let client = aws_sdk_dynamodb::Client::new(&config);

        let hashed_password = bcrypt::hash(password, bcrypt::DEFAULT_COST).map_err(|_| {
            async_graphql::ServerError::new(
                "An error occurred while computing the password hash.",
                None,
            )
        })?;

        let request = client
            .put_item()
            .table_name("primary-table")
            .condition_expression("attribute_not_exists(PK) AND attribute_not_exists(SK)")
            .item(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(format!("USER#{}#", username)),
            )
            .item(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("PROFILE#")),
            )
            .item(
                "groups",
                aws_sdk_dynamodb::types::AttributeValue::L(vec![
                    aws_sdk_dynamodb::types::AttributeValue::S(String::from("MEMBER")),
                ]),
            )
            .item(
                "password",
                aws_sdk_dynamodb::types::AttributeValue::S(hashed_password),
            );

        request.send().await.map_err(|e| {
            println!("{:?}", e);
            async_graphql::Error::new("A database error occurred during user registration.")
        })?;

        Ok(Register { username })
    }
}

#[async_graphql::Object]
impl Register {
    pub async fn username(&self) -> String {
        self.username.to_string()
    }
}
