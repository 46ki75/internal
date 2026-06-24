pub mod input;
pub mod output;

use futures::TryStreamExt;
use notionrs::PaginateExt;

#[derive(Debug, thiserror::Error)]
pub enum BookmarkRepositoryError {
    #[error("Notion API error: {0}")]
    NotionApi(String),
    #[error("HTTP request failed: {0}")]
    Http(String),
    #[error("HTTP body stream error: {0}")]
    HttpBodyStream(String),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

#[async_trait::async_trait]
pub trait BookmarkRepository: Send + Sync {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, BookmarkRepositoryError>;

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        favicon: Option<String>,
    ) -> Result<notionrs_types::object::page::PageResponse, BookmarkRepositoryError>;

    async fn fetch_html(&self, url: &str) -> Result<String, BookmarkRepositoryError>;
}

pub struct BookmarkRepositoryImpl {}

#[async_trait::async_trait]
impl BookmarkRepository for BookmarkRepositoryImpl {
    async fn list_bookmark(
        &self,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, BookmarkRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/bookmark/data_source/id"
        ))
        .await?;

        let request = notionrs_client
            .query_data_source()
            .data_source_id(data_source_id)
            .into_stream()
            .try_collect();

        tracing::debug!("Sending request to Notion API");

        let span = tracing::info_span!("my_span");
        let response = span
            .in_scope(async || {
                request
                    .await
                    .map_err(|e| BookmarkRepositoryError::NotionApi(e.to_string()))
            })
            .await?;
        drop(span);

        Ok(response)
    }

    async fn create_bookmark(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        favicon: Option<String>,
    ) -> Result<notionrs_types::object::page::PageResponse, BookmarkRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/bookmark/data_source/id"
        ))
        .await?;

        tracing::debug!("Sending request to Notion API");
        let mut request = notionrs_client
            .create_page()
            .data_source_id(data_source_id)
            .properties(properties);

        if let Some(url) = favicon {
            request = request.icon(notionrs_types::object::emoji_and_icon::EmojiAndIcon::File(
                notionrs_types::object::file::File::External(
                    notionrs_types::object::file::ExternalFile::from(url),
                ),
            ));
        };

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| BookmarkRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn fetch_html(&self, url: &str) -> Result<String, BookmarkRepositoryError> {
        let client = reqwest::Client::new();
        let html = client
            .get(url)
            .header("user-agent", "Rust/reqwest")
            .send()
            .await
            .map_err(|e| {
                let error = BookmarkRepositoryError::Http(e.to_string());
                tracing::error!("{}", error);
                error
            })?
            .text()
            .await
            .map_err(|e| {
                let error = BookmarkRepositoryError::HttpBodyStream(e.to_string());
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
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, BookmarkRepositoryError> {
        let json = include_bytes!("../bookmark.json");

        let response =
            serde_json::from_slice::<notionrs_types::object::page::PageResponse>(json).unwrap();

        Ok(vec![response])
    }

    async fn create_bookmark(
        &self,
        _properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
        _favicon: Option<String>,
    ) -> Result<notionrs_types::object::page::PageResponse, BookmarkRepositoryError> {
        let json = include_bytes!("../bookmark.json");

        let response =
            serde_json::from_slice::<notionrs_types::object::page::PageResponse>(json).unwrap();

        Ok(response)
    }

    async fn fetch_html(&self, _url: &str) -> Result<String, BookmarkRepositoryError> {
        Ok(String::from(r#"<link rel="icon" href="/favicon.ico" />"#))
    }
}
