use async_graphql::ErrorExtensions;

use crate::{context, services::jwt};

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
        // # --------------------------------------------------------------------------------
        //
        // 引数のバリデーション
        //
        // # --------------------------------------------------------------------------------

        if username.is_empty() {
            return Err(
                async_graphql::FieldError::new("The `username` field is empty.")
                    .extend_with(|_, e| e.set("code", "VAL_400_001")),
            );
        }

        if !regex::Regex::new(r"^[a-zA-Z0-9_\-]+$")
            .unwrap()
            .is_match(&username)
        {
            return Err(async_graphql::FieldError::new(
                "Usernames can only contain alphanumeric characters.",
            )
            .extend_with(|_, e| e.set("code", "VAL_400_002")));
        }

        if password.is_empty() {
            return Err(
                async_graphql::FieldError::new("The `password` field is empty.")
                    .extend_with(|_, e| e.set("code", "VAL_400_001")),
            );
        }

        // # --------------------------------------------------------------------------------
        //
        // ユーザー情報の取得
        //
        // # --------------------------------------------------------------------------------

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
                .extend_with(|_, e| e.set("code", "DB_500_001"))
        })?;

        let item = response.item.ok_or(
            async_graphql::FieldError::new("No user found.")
                .extend_with(|_, e| e.set("code", "DB_404_001")),
        )?;

        let hashed_password_map = item.get("password").ok_or(
            async_graphql::FieldError::new("The password has not been set.")
                .extend_with(|_, e| e.set("code", "DB_500_002")),
        )?;

        let hashed_password = hashed_password_map.as_s().map_err(|_| {
            async_graphql::FieldError::new(
                "The format of the password stored in the database is incorrect.",
            )
            .extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "DB_500_003")
            })
        })?;

        // # --------------------------------------------------------------------------------
        //
        // パスワードの検証
        //
        // # --------------------------------------------------------------------------------

        let is_valid = bcrypt::verify(password, hashed_password).map_err(|_| {
            async_graphql::ServerError::new(
                "Failed to compare the password hash. The stored password hash might be invalid.",
                None,
            )
            .extend_with(|_, e: &mut async_graphql::ErrorExtensionValues| {
                e.set("code", "AUTH_500_001")
            })
        })?;

        if !is_valid {
            return Err(
                async_graphql::FieldError::new("The password is incorrect.").extend_with(
                    |_, e: &mut async_graphql::ErrorExtensionValues| e.set("code", "AUTH_401_001"),
                ),
            );
        }

        // 追加情報のフィールドの取得

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
        // JWT_REFRESH_TOKEN の発行
        //
        // # --------------------------------------------------------------------------------

        let lifetime = 60 * 24 * 7;

        let custom_context = ctx
            .data::<context::CustomContext>()
            .map_err(|_| async_graphql::Error::new("Failed to retrieve `CustomContext`."))?;

        let environment = custom_context.environment.clone();
        let domain = custom_context.domain.clone();

        let jwt_refresh_token = jwt::Jwt::generate_token(
            &config,
            crate::services::jwt::TokenType::JwtRefreshToken,
            domain.clone(),
            username.clone(),
            lifetime,
        )
        .await?;

        let jwt_refresh_token_cookie =
            cookie::Cookie::build(("JWT_REFRESH_TOKEN", jwt_refresh_token.value))
                .domain(domain)
                .path("/")
                .secure(environment != "development")
                .same_site(cookie::SameSite::Strict)
                .http_only(true)
                .expires(
                    cookie::time::OffsetDateTime::now_utc()
                        + std::time::Duration::from_secs((lifetime * 60).into()),
                )
                .build();

        ctx.insert_http_header("set-cookie", jwt_refresh_token_cookie.to_string());

        Ok(Login { username, groups })
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
