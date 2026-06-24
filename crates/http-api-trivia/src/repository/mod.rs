pub mod input;
pub mod output;

use notionrs_types::prelude::*;

#[derive(Debug, thiserror::Error)]
pub enum TriviaRepositoryError {
    #[error("Notion API error: {0}")]
    NotionApi(String),
    #[error("block conversion error: {0}")]
    BlockConversion(#[from] n2a2ui::error::Error),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

#[async_trait::async_trait]
pub trait TriviaRepository: Send + Sync {
    /// Lists trivia pages ordered by `view_count` ascending (least-viewed first).
    async fn list_trivia(
        &self,
        page_size: u32,
    ) -> Result<notionrs_types::object::response::ListResponse<PageResponse>, TriviaRepositoryError>;

    async fn get_trivia_by_id(&self, id: &str) -> Result<PageResponse, TriviaRepositoryError>;

    async fn update_view_count(
        &self,
        page_id: &str,
        view_count: u32,
    ) -> Result<PageResponse, TriviaRepositoryError>;

    async fn list_blocks_by_id(
        &self,
        page_id: &str,
    ) -> Result<n2a2ui_a2ui::v0_9::Surface, TriviaRepositoryError>;
}

pub struct TriviaRepositoryImpl {}

#[async_trait::async_trait]
impl TriviaRepository for TriviaRepositoryImpl {
    async fn list_trivia(
        &self,
        page_size: u32,
    ) -> Result<notionrs_types::object::response::ListResponse<PageResponse>, TriviaRepositoryError>
    {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/trivia/data_source/id"
        ))
        .await?;

        let sorts = vec![Sort::asc("view_count")];

        let request = notionrs_client
            .query_data_source()
            .data_source_id(data_source_id)
            .sorts(sorts)
            .page_size(page_size);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| TriviaRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn get_trivia_by_id(&self, id: &str) -> Result<PageResponse, TriviaRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let request = notionrs_client.get_page().page_id(id);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| TriviaRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn update_view_count(
        &self,
        page_id: &str,
        view_count: u32,
    ) -> Result<PageResponse, TriviaRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let mut properties: std::collections::HashMap<String, PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "view_count".to_string(),
            PageProperty::Number(PageNumberProperty::from(view_count)),
        );

        let request = notionrs_client
            .update_page()
            .page_id(page_id)
            .properties(properties);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| TriviaRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn list_blocks_by_id(
        &self,
        page_id: &str,
    ) -> Result<n2a2ui_a2ui::v0_9::Surface, TriviaRepositoryError> {
        let client = http_api_core::cache::get_or_init_n2a2ui_client().await?;

        tracing::debug!("Sending request to Notion API");
        let surface = client.convert_block(page_id).await?;

        Ok(surface)
    }
}

pub struct TriviaRepositoryStub;

#[async_trait::async_trait]
impl TriviaRepository for TriviaRepositoryStub {
    async fn list_trivia(
        &self,
        _page_size: u32,
    ) -> Result<notionrs_types::object::response::ListResponse<PageResponse>, TriviaRepositoryError>
    {
        Ok(notionrs_types::object::response::ListResponse {
            object: "list".to_string(),
            results: vec![stub_page("4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e", 3.0)],
            next_cursor: None,
            has_more: Some(false),
            r#type: Some("page".to_string()),
            request_status: None,
        })
    }

    async fn get_trivia_by_id(&self, id: &str) -> Result<PageResponse, TriviaRepositoryError> {
        Ok(stub_page(id, 3.0))
    }

    async fn update_view_count(
        &self,
        page_id: &str,
        view_count: u32,
    ) -> Result<PageResponse, TriviaRepositoryError> {
        Ok(stub_page(page_id, view_count as f64))
    }

    async fn list_blocks_by_id(
        &self,
        _page_id: &str,
    ) -> Result<n2a2ui_a2ui::v0_9::Surface, TriviaRepositoryError> {
        let root_id = "root".to_string();
        let root = n2a2ui_a2ui::v0_9::Column {
            id: root_id.clone(),
            children: n2a2ui_a2ui::v0_9::ChildList::Static(Vec::new()),
            ..Default::default()
        };

        let mut components = indexmap::IndexMap::new();
        components.insert(root_id.clone(), n2a2ui_a2ui::v0_9::Component::Column(root));

        Ok(n2a2ui_a2ui::v0_9::Surface {
            root: root_id,
            components,
        })
    }
}

fn stub_page(id: &str, view_count: f64) -> PageResponse {
    let user = notionrs_types::object::user::User {
        object: "user".to_string(),
        id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
        ..Default::default()
    };

    let mut properties = std::collections::HashMap::new();
    properties.insert(
        "title".to_string(),
        PageProperty::Title(PageTitleProperty::from("title".to_string())),
    );
    properties.insert(
        "view_count".to_string(),
        PageProperty::Number(PageNumberProperty::from(view_count)),
    );

    PageResponse {
        id: id.to_string(),
        created_time: time::OffsetDateTime::parse(
            "2022-06-28T00:00:00Z",
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap(),
        last_edited_time: time::OffsetDateTime::parse(
            "2022-06-28T00:00:00Z",
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap(),
        created_by: user.clone(),
        last_edited_by: user,
        cover: None,
        icon: None,
        parent: notionrs_types::object::parent::Parent::PageParent(
            notionrs_types::object::parent::PageParent {
                r#type: "page_id".to_string(),
                page_id: "7e39472a-dfeb-41c9-a97c-f66c85e9dafe".to_string(),
            },
        ),
        #[allow(deprecated)]
        archived: false,
        properties,
        url: "https://www.notion.com/".to_string(),
        public_url: None,
        developer_survey: None,
        request_id: None,
        in_trash: false,
        is_locked: false,
        is_archived: false,
    }
}
