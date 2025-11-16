use super::super::service::*;

#[derive(Debug, Default)]
pub struct BookmarkMutationResolver;

#[derive(async_graphql::InputObject, Debug, Default)]
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
    ) -> Result<super::Bookmark, async_graphql::Error> {
        let bookmark_service = ctx.data::<std::sync::Arc<BookmarkService>>()?;

        let bookmark = bookmark_service
            .create_bookmark(&input.name, &input.url)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?
            .into();

        Ok(bookmark)
    }
}
