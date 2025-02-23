pub struct AnkiQueryResolver {
    pub anki_service: std::sync::Arc<crate::service::anki::AnkiService>,
}

#[derive(async_graphql::InputObject)]
pub struct AnkiInput {
    pub page_id: String,
}

#[derive(async_graphql::InputObject)]
pub struct AnkiListInput {
    page_size: Option<u32>,
    next_cursor: Option<String>,
}

#[async_graphql::Object]
impl AnkiQueryResolver {
    pub async fn anki(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: AnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        let anki = self
            .anki_service
            .get_anki_by_id(&input.page_id)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(anki)
    }

    pub async fn anki_list(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: Option<AnkiListInput>,
    ) -> Result<crate::model::anki::AnkiConnection, async_graphql::Error> {
        let input = input.unwrap_or(AnkiListInput {
            page_size: None,
            next_cursor: None,
        });

        let anki_list = self
            .anki_service
            .list_anki(input.page_size.unwrap_or(50), input.next_cursor)
            .await
            .map_err(|e| e.to_string())?;

        Ok(anki_list)
    }
}
