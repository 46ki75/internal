pub mod learn;

pub struct Anki {
    pub notion_api_key: String,
    pub database_id: String,
}

impl Anki {
    pub async fn new(ctx: &async_graphql::Context<'_>) -> Result<Self, async_graphql::Error> {
        // # --------------------------------------------------------------------------------
        //
        // 認可 (ネストされた下位クエリにも適用される)
        //
        // # --------------------------------------------------------------------------------

        let raw_cookie = ctx
            .data::<lambda_http::http::HeaderMap<lambda_http::http::HeaderValue>>()
            .unwrap()
            .get("cookie")
            .ok_or(async_graphql::FieldError::new("Cookies are not enabled."))?
            .to_str()
            .map_err(|_| async_graphql::FieldError::new("Failed to parse the cookie."))?;

        let token_data = crate::services::jwt::Jwt::validateand_decode_token(
            raw_cookie.into(),
            crate::services::jwt::TokenType::JwtAccessToken,
        )
        .await?;

        if token_data.claims.sub != "shirayuki" {
            return Err(async_graphql::Error::new("FORBIDDEN"));
        }

        let region = aws_config::Region::from_static("ap-northeast-1");
        let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
            .region(region)
            .load()
            .await;

        let client = aws_sdk_ssm::Client::new(&config);

        // # --------------------------------------------------------------------------------
        //
        // fetch notion_api_key
        //
        // # --------------------------------------------------------------------------------

        let request = client
            .get_parameter()
            .name("/internal/web/dev/notion/default/secret")
            .with_decryption(true);

        let response = request.send().await?;

        let notion_api_key = response.parameter.unwrap().value.unwrap();

        // # --------------------------------------------------------------------------------
        //
        // fetch database_id
        //
        // # --------------------------------------------------------------------------------

        let request = client
            .get_parameter()
            .name("/internal/general/common/notion/database/anki/id");

        let response = request.send().await?;

        let database_id = response.parameter.unwrap().value.unwrap();

        Ok(Anki {
            notion_api_key,
            database_id,
        })
    }
}

#[async_graphql::Object]
impl Anki {
    /// AnkiデータベースのID
    pub async fn database_id(&self) -> Result<String, async_graphql::Error> {
        Ok(self.database_id.to_string())
    }

    /// 次に学習するAnkiカードを取得するクエリ
    pub async fn learn(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<learn::Learn, async_graphql::Error> {
        learn::Learn::new(
            ctx,
            self.notion_api_key.to_string(),
            self.database_id.to_string(),
        )
        .await
    }
}
