pub struct BookmarkMutationResolver;

#[derive(async_graphql::InputObject)]
pub struct CreateBookmarkInput {
    pub name: String,
    pub url: String,
}

#[async_graphql::Object]
impl BookmarkMutationResolver {
    pub async fn create_bookmark(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: CreateBookmarkInput,
    ) -> Result<crate::model::bookmark::Bookmark, async_graphql::Error> {
        let bookmark_service =
            ctx.data::<std::sync::Arc<crate::service::bookmark::BookmarkService>>()?;

        let bookmark = bookmark_service
            .create_bookmark(&input.name, &input.url)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        Ok(bookmark)
    }
}
