#[derive(Default)]
pub struct AnkiQuery;

#[derive(async_graphql::InputObject)]
pub struct AnkiInput {
    pub page_id: String,
}

#[derive(async_graphql::InputObject)]
pub struct ListAnkiInput {
    pub page_size: Option<u32>,
    pub next_cursor: Option<String>,
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
    ) -> Result<crate::model::anki::AnkiConnection, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_ANKI_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_ANKI_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let sorts = vec![notionrs::database::Sort::asc("nextReviewAt")];

        let (page_size, next_cursor) = match input {
            Some(input) => (input.page_size.unwrap_or(1), input.next_cursor),
            None => (100, None),
        };

        let mut request = client
            .query_database()
            .database_id(database_id)
            .sorts(sorts)
            .page_size(page_size);

        if let Some(next_cursor) = next_cursor {
            request = request.start_cursor(next_cursor);
        }

        let response = request.send().await?;

        let end_cursor = response.results.last().map(|page| page.id.clone());

        let pages = response.results;

        let anki_meta = pages
            .into_iter()
            .map(super::util::try_convert)
            .collect::<Result<Vec<super::Anki>, async_graphql::Error>>()?;

        let relay_connection = crate::model::anki::AnkiConnection {
            edges: anki_meta
                .into_iter()
                .map(|node| crate::model::anki::AnkiEdge {
                    cursor: node.page_id.to_string(),
                    node,
                })
                .collect(),
            page_info: crate::model::PageInfo {
                next_cursor: response.next_cursor,
                end_cursor,
                ..Default::default()
            },
        };

        Ok(relay_connection)
    }
}
