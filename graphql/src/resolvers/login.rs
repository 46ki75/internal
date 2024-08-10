use aws_config::imds::client::error;

pub struct Login {
    pub username: String,
    pub groups: Vec<String>,
}

impl Login {
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

        let request = client
            .get_item()
            .table_name("primary-table")
            .key(
                "PK",
                aws_sdk_dynamodb::types::AttributeValue::S(format!("USER#{}#", username)),
            )
            .key(
                "SK",
                aws_sdk_dynamodb::types::AttributeValue::S("PROFILE#".into()),
            );

        let response = request.send().await.map_err(|_| {
            async_graphql::ServerError::new("An error occurred during the database request.", None)
        })?;

        let item = response
            .item
            .ok_or(async_graphql::FieldError::new("No user found."))?;

        let hashed_password_map = item.get("password").ok_or(async_graphql::FieldError::new(
            "The password has not been set.",
        ))?;

        let hashed_password = hashed_password_map.as_s().map_err(|_| {
            async_graphql::FieldError::new(
                "The format of the password stored in the database is incorrect.",
            )
        })?;

        let is_valid = bcrypt::verify(password, hashed_password).map_err(|_| {
            async_graphql::ServerError::new("The password validation process failed.", None)
        })?;

        let groups = item
            .get("groups")
            .unwrap_or(&aws_sdk_dynamodb::types::AttributeValue::L(vec![]))
            .as_l()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|v| v.as_s().ok())
            .cloned()
            .collect::<Vec<String>>();

        // TODO: Implement the issuance of access tokens and refresh tokens.

        if is_valid {
            Ok(Login { username, groups })
        } else {
            Err(async_graphql::FieldError::new("The password is incorrect."))
        }
    }
}

#[async_graphql::Object]
impl Login {
    pub async fn message(&self) -> &str {
        "Login successful."
    }

    pub async fn username(&self) -> &str {
        &self.username
    }

    pub async fn groups(&self) -> &Vec<String> {
        &self.groups
    }
}
