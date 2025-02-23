#[async_trait::async_trait]
pub trait BookmarkRepository: Send + Sync {
    async fn list_bookmark(
        &self,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::page_response::PageResponse>,
        crate::error::Error,
    >;
}

pub struct BookmarkRepositoryImpl;

#[async_trait::async_trait]
impl BookmarkRepository for BookmarkRepositoryImpl {
    async fn list_bookmark(
        &self,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::page_response::PageResponse>,
        crate::error::Error,
    > {
        let secret = std::env::var("NOTION_API_KEY").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound("NOTION_API_KEY".to_string())
        })?;

        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound(
                "NOTION_BOOKMARK_DATABASE_ID".to_string(),
            )
        })?;

        let client = notionrs::client::Client::new().secret(secret);

        let request = client
            .query_database()
            .database_id(database_id)
            .page_size(100);

        let response = request.send().await?;

        Ok(response)
    }
}

pub struct BookmarkRepositoryStub;

#[async_trait::async_trait]
impl BookmarkRepository for BookmarkRepositoryStub {
    async fn list_bookmark(
        &self,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::page_response::PageResponse>,
        crate::error::Error,
    > {
        let json = include_bytes!("./bookmark.json");

        let response = serde_json::from_slice::<
            notionrs::list_response::ListResponse<notionrs::page::PageResponse>,
        >(json)
        .unwrap();

        Ok(response)
    }
}
