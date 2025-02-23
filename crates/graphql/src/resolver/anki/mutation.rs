pub struct AnkiMutationResolver;

#[derive(async_graphql::InputObject)]
pub struct CreateAnkiInput {
    title: Option<String>,
}

#[derive(async_graphql::InputObject)]
pub struct UpdateAnkiInput {
    page_id: String,
    ease_factor: f64,
    repetition_count: u32,
    next_review_at: String,
}

#[async_graphql::Object]
impl AnkiMutationResolver {
    pub async fn create_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: CreateAnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        Ok(anki_service
            .create_anki(input.title)
            .await
            .map_err(|e| e.to_string())?)
    }

    pub async fn update_anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: UpdateAnkiInput,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        Ok(anki_service
            .update_anki(
                input.page_id,
                input.ease_factor,
                input.repetition_count,
                input.next_review_at,
            )
            .await
            .map_err(|e| e.to_string())?)
    }
}
