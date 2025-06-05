#[derive(Debug, Default)]
pub struct AnkiMutationResolver;

#[async_graphql::Object]
impl AnkiMutationResolver {
    pub async fn create_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        title: Option<String>,
    ) -> Result<super::Anki, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let anki_entity = anki_service
            .create_anki(title)
            .await
            .map_err(|e| e.to_string())?;

        let anki = super::Anki::from(anki_entity);

        Ok(anki)
    }

    pub async fn update_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        page_id: String,
        ease_factor: Option<f64>,
        repetition_count: Option<u32>,
        next_review_at: Option<String>,
        is_review_required: Option<bool>,
    ) -> Result<super::Anki, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let anki_entity = anki_service
            .update_anki(
                page_id.as_ref(),
                ease_factor,
                repetition_count,
                next_review_at,
                is_review_required,
            )
            .await
            .map_err(|e| e.to_string())?;

        let anki = super::Anki::from(anki_entity);

        Ok(anki)
    }
}
