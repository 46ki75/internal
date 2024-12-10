#[derive(Default)]
pub struct AnkiQuery;

#[derive(async_graphql::InputObject)]
pub struct AnkiInput {
    pub page_id: String,
}

#[derive(async_graphql::InputObject)]
pub struct ListAnkiInput {
    pub page_size: Option<u32>,
}

#[async_graphql::Object]
impl AnkiQuery {
    pub async fn anki(&self, input: AnkiInput) -> Result<super::Anki, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let request = client.get_page().page_id(&input.page_id);

        let response = request.send().await?;

        super::util::try_convert(response)
    }

    pub async fn list_anki(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: Option<ListAnkiInput>,
    ) -> Result<Vec<super::Anki>, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_ANKI_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_ANKI_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let sorts = vec![notionrs::database::Sort::asc("nextReviewAt")];

        let page_size = input.map_or(100, |input| input.page_size.unwrap_or(100));

        let request = client
            .query_database()
            .database_id(database_id)
            .sorts(sorts)
            .page_size(page_size);

        let response = request.send().await?;

        let pages = response.results;

        let anki_meta = pages
            .into_iter()
            .map(super::util::try_convert)
            .collect::<Result<Vec<super::Anki>, async_graphql::Error>>()?;

        Ok(anki_meta)
    }
}
