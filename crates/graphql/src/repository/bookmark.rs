#[async_trait::async_trait]
pub trait BookmarkRepository: Send + Sync {
    async fn list_bookmark(
        &self,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::page_response::PageResponse>,
        crate::error::Error,
    >;

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
        favicon: &str,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error>;
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
        let secret = std::env::var("NOTION_API_KEY")?;
        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID")?;

        let client = notionrs::client::Client::new().secret(secret);

        let request = client
            .query_database()
            .database_id(database_id)
            .page_size(100);

        let response = request.send().await?;

        Ok(response)
    }

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
        favicon: &str,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error> {
        let secret = std::env::var("NOTION_API_KEY")?;

        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID")?;

        let client = notionrs::client::Client::new().secret(&secret);

        let request = client
            .create_page()
            .database_id(database_id)
            .properties(properties)
            .icon(notionrs::others::icon::Icon::File(
                notionrs::File::External(notionrs::others::file::ExternalFile::from(favicon)),
            ));

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
        let json = include_bytes!("./bookmark_list.json");

        let response = serde_json::from_slice::<
            notionrs::list_response::ListResponse<notionrs::page::PageResponse>,
        >(json)
        .unwrap();

        Ok(response)
    }

    async fn create_bookmark(
        &self,
        _properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
        _favicon: &str,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error> {
        let json = include_bytes!("./bookmark.json");

        let response = serde_json::from_slice::<notionrs::page::PageResponse>(json).unwrap();

        Ok(response)
    }
}
