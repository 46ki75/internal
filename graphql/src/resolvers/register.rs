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

        // confirmation of user existence

        let request = client
            .get_item()
            .table_name("primary-table")
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(format!("USER#{}#", username)),
            )
            .key(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S(String::from("PROFILE#")),
            );

        let response = request.send().await;

        let item = match response {
            Err(_) => {
                return Err(async_graphql::ServerError::new(
                    "A database error occurred while retrieving user information.",
                    None,
                )
                .into())
            }
            Ok(v) => v.item,
        };

        if item.is_some() {
            return Err(async_graphql::FieldError::new(
                "The requested username already exists.",
            ));
        }

        // Create User

        let hashed_password = bcrypt::hash(password, bcrypt::DEFAULT_COST).map_err(|_| {
            async_graphql::ServerError::new(
                "An error occurred while computing the password hash.",
                None,
            )
        })?;

        let request = client
            .put_item()
            .table_name("primary-table")
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

        request.send().await.map_err(|_| {
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
