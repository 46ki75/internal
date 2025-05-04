#[async_trait::async_trait]
pub trait BookmarkRepository: Send + Sync {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error>;

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        favicon: &str,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error>;
}

pub struct BookmarkRepositoryImpl {
    pub config: std::sync::Arc<crate::config::Config>,
}

#[async_trait::async_trait]
impl BookmarkRepository for BookmarkRepositoryImpl {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error> {
        let database_id = self.config.notion_bookmark_database_id.as_str();

        let request = self
            .config
            .notion_client
            .query_database_all()
            .database_id(database_id);

        tracing::debug!("Sending request to Notion API");

        let span = tracing::info_span!("my_span");
        let response = span
            .in_scope(async || {
                request.send().await.map_err(|e| {
                    let error_message = format!("Notion API error: {}", e);
                    log::error!("{}", error_message);
                    crate::error::Error::NotionRs(error_message)
                })
            })
            .await?;
        drop(span);

        Ok(response)
    }

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        favicon: &str,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let database_id = self.config.notion_bookmark_database_id.as_str();

        tracing::debug!("Sending request to Notion API");
        let request = self
            .config
            .notion_client
            .create_page()
            .database_id(database_id)
            .properties(properties)
            .icon(notionrs_types::object::icon::Icon::File(
                notionrs_types::object::file::File::External(
                    notionrs_types::object::file::ExternalFile::from(favicon),
                ),
            ));

        tracing::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }
}

pub struct BookmarkRepositoryStub;

#[async_trait::async_trait]
impl BookmarkRepository for BookmarkRepositoryStub {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error> {
        let json = include_bytes!("./bookmark.json");

        let response =
            serde_json::from_slice::<notionrs_types::object::page::PageResponse>(json).unwrap();

        Ok(vec![response])
    }

    async fn create_bookmark(
        &self,
        _properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        _favicon: &str,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let json = include_bytes!("./bookmark.json");

        let response =
            serde_json::from_slice::<notionrs_types::object::page::PageResponse>(json).unwrap();

        Ok(response)
    }
}
