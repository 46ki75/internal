use futures::TryStreamExt;
use notionrs::PaginateExt;

#[async_trait::async_trait]
pub trait BookmarkRepository: Send + Sync {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error>;

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        favicon: Option<String>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error>;

    async fn fetch_html(&self, url: &str) -> Result<String, crate::error::Error>;
}

pub struct BookmarkRepositoryImpl {}

#[async_trait::async_trait]
impl BookmarkRepository for BookmarkRepositoryImpl {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error> {
        let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

        let data_source_id = crate::cache::get_or_init_notion_bookmark_data_source_id().await?;

        let request = notionrs_client
            .query_data_source()
            .data_source_id(data_source_id)
            .into_stream()
            .try_collect();

        tracing::debug!("Sending request to Notion API");

        let span = tracing::info_span!("my_span");
        let response = span
            .in_scope(async || {
                request.await.map_err(|e| {
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
        favicon: Option<String>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

        let data_source_id = crate::cache::get_or_init_notion_bookmark_data_source_id().await?;

        tracing::debug!("Sending request to Notion API");
        let mut request = notionrs_client
            .create_page()
            .data_source_id(data_source_id)
            .properties(properties);

        if let Some(url) = favicon {
            request = request.icon(notionrs_types::object::icon::Icon::File(
                notionrs_types::object::file::File::External(
                    notionrs_types::object::file::ExternalFile::from(url),
                ),
            ));
        };

        tracing::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn fetch_html(&self, url: &str) -> Result<String, crate::error::Error> {
        let client = reqwest::Client::new();
        let html = client
            .get(url)
            .header("user-agent", "Rust/reqwest")
            .send()
            .await
            .map_err(|e| {
                let error = crate::error::Error::Http(e.to_string());
                tracing::error!("{}", error);
                error
            })?
            .text()
            .await
            .map_err(|e| {
                let error = crate::error::Error::HttpBodyStream(e.to_string());
                tracing::error!("{}", error);
                error
            })?;

        Ok(html)
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
        _favicon: Option<String>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let json = include_bytes!("./bookmark.json");

        let response =
            serde_json::from_slice::<notionrs_types::object::page::PageResponse>(json).unwrap();

        Ok(response)
    }

    async fn fetch_html(&self, _url: &str) -> Result<String, crate::error::Error> {
        Ok(String::from(r#"<link rel="icon" href="/favicon.ico" />"#))
    }
}
