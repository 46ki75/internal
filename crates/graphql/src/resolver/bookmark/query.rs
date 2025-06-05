pub struct BookmarkQueryResolver;

impl BookmarkQueryResolver {
    pub async fn list_bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<Vec<super::Bookmark>, async_graphql::Error> {
        let bookmark_service =
            ctx.data::<std::sync::Arc<crate::service::bookmark::BookmarkService>>()?;

        let bookmarks = bookmark_service
            .list_bookmark()
            .await
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|bookmark_entity| super::Bookmark::from(bookmark_entity))
            .collect::<Vec<super::Bookmark>>();

        Ok(bookmarks)
    }
}
