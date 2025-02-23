pub struct BookmarkQueryResolver;

impl BookmarkQueryResolver {
    pub async fn list_bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<crate::model::bookmark::Bookmark>, async_graphql::Error> {
        let bookmark_service =
            ctx.data::<std::sync::Arc<crate::service::bookmark::BookmarkService>>()?;

        let response = bookmark_service
            .list_bookmark()
            .await
            .map_err(|e| e.to_string())?;

        Ok(response)
    }
}
