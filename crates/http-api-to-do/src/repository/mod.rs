pub mod input;
pub mod output;

use futures::TryStreamExt;
use notionrs::PaginateExt;

#[derive(Debug, thiserror::Error)]
pub enum ToDoRepositoryError {
    #[error("Notion API error: {0}")]
    NotionApi(String),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

#[async_trait::async_trait]
pub trait ToDoRepository {
    async fn create_to_do(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, ToDoRepositoryError>;

    async fn update_to_do(
        &self,
        id: String,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, ToDoRepositoryError>;

    async fn list_notion_to_do(
        &self,
        filter: notionrs_types::object::request::filter::Filter,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, ToDoRepositoryError>;
}

pub struct ToDoRepositoryImpl {}

#[async_trait::async_trait]
impl ToDoRepository for ToDoRepositoryImpl {
    async fn create_to_do(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, ToDoRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/todo/data_source/id"
        ))
        .await?;

        let request = notionrs_client
            .create_page()
            .data_source_id(data_source_id)
            .properties(properties);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| ToDoRepositoryError::NotionApi(e.to_string()))?
            .into_page()
            .map_err(|e| ToDoRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn update_to_do(
        &self,
        id: String,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, ToDoRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let request = notionrs_client
            .update_page()
            .page_id(&id)
            .properties(properties);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| ToDoRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn list_notion_to_do(
        &self,
        filter: notionrs_types::object::request::filter::Filter,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, ToDoRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/todo/data_source/id"
        ))
        .await?;

        let request = notionrs_client
            .query_data_source()
            .filter(filter)
            .data_source_id(data_source_id)
            .into_stream()
            .try_collect();

        tracing::debug!("Sending request to Notion API");
        let response = request
            .await
            .map_err(|e| ToDoRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }
}

pub struct ToDoRepositoryStub;

#[async_trait::async_trait]
impl ToDoRepository for ToDoRepositoryStub {
    async fn create_to_do(
        &self,
        _properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, ToDoRepositoryError> {
        let json = include_bytes!("../to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(response)
    }

    async fn update_to_do(
        &self,
        _id: String,
        _properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, ToDoRepositoryError> {
        let json = include_bytes!("../to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(response)
    }

    async fn list_notion_to_do(
        &self,
        _filter: notionrs_types::object::request::filter::Filter,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, ToDoRepositoryError> {
        let json = include_bytes!("../to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(vec![response])
    }
}
