use futures::TryStreamExt;
use notionrs::PaginateExt;

#[async_trait::async_trait]
pub trait ToDoRepository {
    async fn create_to_do(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error>;

    async fn update_to_do(
        &self,
        id: String,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error>;

    async fn list_notion_to_do(
        &self,
        filter: notionrs_types::object::request::filter::Filter,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error>;
}

pub struct ToDoRepositoryImpl {}

#[async_trait::async_trait]
impl ToDoRepository for ToDoRepositoryImpl {
    async fn create_to_do(
        &self,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

        let data_source_id = crate::cache::get_or_init_notion_to_do_data_source_id().await?;

        let request = notionrs_client
            .create_page()
            .data_source_id(data_source_id)
            .properties(properties);

        tracing::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn update_to_do(
        &self,
        id: String,
        properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

        let request = notionrs_client
            .update_page()
            .page_id(&id)
            .properties(properties);

        tracing::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn list_notion_to_do(
        &self,
        filter: notionrs_types::object::request::filter::Filter,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error> {
        let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

        let data_source_id = crate::cache::get_or_init_notion_to_do_data_source_id().await?;

        let request = notionrs_client
            .query_data_source()
            .filter(filter)
            .data_source_id(data_source_id)
            .into_stream()
            .try_collect();

        tracing::debug!("Sending request to Notion API");
        let response = request.await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }
}

pub struct ToDoRepositoryStub;

#[async_trait::async_trait]
impl ToDoRepository for ToDoRepositoryStub {
    async fn create_to_do(
        &self,
        _properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let json = include_bytes!("./to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(response)
    }

    async fn update_to_do(
        &self,
        _id: String,
        _properties: std::collections::HashMap<String, notionrs_types::object::page::PageProperty>,
    ) -> Result<notionrs_types::object::page::PageResponse, crate::error::Error> {
        let json = include_bytes!("./to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(response)
    }

    async fn list_notion_to_do(
        &self,
        _filter: notionrs_types::object::request::filter::Filter,
    ) -> Result<Vec<notionrs_types::object::page::PageResponse>, crate::error::Error> {
        let json = include_bytes!("./to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(vec![response])
    }
}
