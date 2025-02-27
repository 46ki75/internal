#[async_trait::async_trait]
pub trait ToDoRepository {
    async fn create_to_do(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error>;

    async fn update_to_do(
        &self,
        id: String,
        properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error>;

    async fn list_notion_to_do(
        &self,
        filter: notionrs::filter::Filter,
    ) -> Result<Vec<notionrs::page::page_response::PageResponse>, crate::error::Error>;
}

pub struct ToDoRepositoryImpl {
    pub config: std::sync::Arc<crate::config::Config>,
}

#[async_trait::async_trait]
impl ToDoRepository for ToDoRepositoryImpl {
    async fn create_to_do(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error> {
        let secret = self.config.notion_api_key.as_str();
        let database_id = self.config.notion_to_do_database_id.as_str();

        let client = notionrs::client::Client::new().secret(secret);

        let request = client
            .create_page()
            .database_id(database_id)
            .properties(properties);

        let response = request.send().await?;

        Ok(response)
    }

    async fn update_to_do(
        &self,
        id: String,
        properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error> {
        let secret = self.config.notion_api_key.as_str();

        let client = notionrs::client::Client::new().secret(secret);

        let request = client.update_page().page_id(&id).properties(properties);

        let response = request.send().await?;

        Ok(response)
    }

    async fn list_notion_to_do(
        &self,
        filter: notionrs::filter::Filter,
    ) -> Result<Vec<notionrs::page::page_response::PageResponse>, crate::error::Error> {
        let secret = self.config.notion_api_key.as_str();
        let database_id = self.config.notion_to_do_database_id.as_str();

        let client = notionrs::client::Client::new().secret(secret);

        let request = client
            .query_database_all()
            .filter(filter)
            .database_id(database_id);

        let response = request.send().await?;

        Ok(response)
    }
}

pub struct ToDoRepositoryStub;

#[async_trait::async_trait]
impl ToDoRepository for ToDoRepositoryStub {
    async fn create_to_do(
        &self,
        _properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error> {
        let json = include_bytes!("./to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(response)
    }

    async fn update_to_do(
        &self,
        _id: String,
        _properties: std::collections::HashMap<String, notionrs::page::properties::PageProperty>,
    ) -> Result<notionrs::page::page_response::PageResponse, crate::error::Error> {
        let json = include_bytes!("./to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(response)
    }

    async fn list_notion_to_do(
        &self,
        _filter: notionrs::filter::Filter,
    ) -> Result<Vec<notionrs::page::page_response::PageResponse>, crate::error::Error> {
        let json = include_bytes!("./to_do.json");

        let response = serde_json::from_slice(json)?;

        Ok(vec![response])
    }
}
