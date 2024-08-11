use crate::services::jwt;

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq)]
pub enum Group {
    /// Possess administrator privileges
    Admin,
    /// Member account
    Member,
}

pub struct Login {
    pub username: String,
    pub groups: Vec<Group>,
}

impl Login {
    pub async fn new(
        ctx: &async_graphql::Context<'_>,
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
            .filter_map(|v| v.as_s().ok()) // Option<&str>を取り出す
            .filter_map(|s| match s.as_str() {
                "ADMIN" => Some(Group::Admin),
                "MEMBER" => Some(Group::Member),
                _ => None,
            })
            .collect::<Vec<Group>>();

        // # --------------------------------------------------------------------------------
        //
        // Issuing a JWT
        //
        // # --------------------------------------------------------------------------------

        let rust_env = std::env::var("ENVIRONMENT").unwrap_or(String::from("production"));
        let domain = if rust_env == "development" {
            "localhost".to_string()
        } else {
            "internal.46ki75.com".to_string()
        };

        let jwt_refresh_token =
            jwt::Jwt::generate_refresh_token(&config, domain.clone(), username.clone()).await?;

        let jwt_refresh_token_cookie =
            cookie::Cookie::build(("JWT_REFRESH_TOKEN", jwt_refresh_token.value))
                .domain(domain)
                .path("/")
                .secure(rust_env != "development")
                .same_site(cookie::SameSite::Strict)
                .http_only(true)
                .build();

        ctx.insert_http_header("set-cookie", jwt_refresh_token_cookie.to_string());

        if is_valid {
            Ok(Login { username, groups })
        } else {
            Err(async_graphql::FieldError::new("The password is incorrect."))
        }
    }
}

#[async_graphql::Object]
impl Login {
    /// Status Message
    pub async fn message(&self) -> &str {
        "Login successful."
    }

    /// Username of the logged-in user
    pub async fn username(&self) -> &str {
        &self.username
    }

    /// Name of the group to which one belongs
    pub async fn groups(&self) -> &Vec<Group> {
        &self.groups
    }
}
