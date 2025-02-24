pub struct AnkiQueryResolver;

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
        ctx: &async_graphql::Context<'_>,
        input: AnkiInput,
    ) -> Result<crate::entity::anki::Anki, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let anki = anki_service
            .get_anki_by_id(&input.page_id)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(anki)
    }

    pub async fn anki_list(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: Option<AnkiListInput>,
    ) -> Result<crate::entity::anki::AnkiConnection, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let input = input.unwrap_or(AnkiListInput {
            page_size: None,
            next_cursor: None,
        });

        let anki_list = anki_service
            .list_anki(input.page_size.unwrap_or(50), input.next_cursor)
            .await
            .map_err(|e| e.to_string())?;

        Ok(anki_list)
    }
}

#[async_graphql::Object]
impl crate::entity::anki::Anki {
    async fn page_id(&self) -> &str {
        &self.page_id
    }

    async fn title(&self) -> Option<&str> {
        self.title.as_deref()
    }

    async fn description(&self) -> Option<&str> {
        self.description.as_deref()
    }

    async fn ease_factor(&self) -> f64 {
        self.ease_factor
    }

    async fn repetition_count(&self) -> u32 {
        self.repetition_count
    }

    async fn next_review_at(&self) -> &str {
        &self.next_review_at
    }

    async fn created_at(&self) -> &str {
        &self.created_at
    }

    async fn updated_at(&self) -> &str {
        &self.updated_at
    }

    async fn tags(&self) -> &[crate::entity::anki::AnkiTag] {
        &self.tags
    }

    async fn url(&self) -> &str {
        &self.url
    }

    pub async fn block_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<crate::entity::anki::AnkiBlock, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let blocks = anki_service
            .list_blocks(&self.page_id)
            .await
            .map_err(|e| e.to_string())?;

        Ok(blocks)
    }
}
