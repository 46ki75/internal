pub mod learn;

pub struct Anki {
    pub notion_api_key: String,
    pub database_id: String,
}

impl Anki {
    pub async fn new() -> Result<Self, async_graphql::Error> {
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
    pub async fn database_id(&self) -> Result<String, async_graphql::Error> {
        Ok(self.database_id.to_string())
    }

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
