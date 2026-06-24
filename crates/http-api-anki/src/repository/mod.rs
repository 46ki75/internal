pub mod input;
pub mod output;

use notionrs_types::prelude::*;

#[derive(Debug, thiserror::Error)]
pub enum AnkiRepositoryError {
    #[error("Notion API error: {0}")]
    NotionApi(String),
    #[error("block conversion error: {0}")]
    BlockConversion(#[from] n2a2ui::error::Error),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

#[async_trait::async_trait]
pub trait AnkiRepository: Send + Sync {
    async fn get_anki_by_id(&self, id: &str) -> Result<PageResponse, AnkiRepositoryError>;

    async fn list_anki(
        &self,
        page_size: u32,
        next_cursor: Option<String>,
    ) -> Result<notionrs_types::object::response::ListResponse<PageResponse>, AnkiRepositoryError>;

    async fn create_anki(
        &self,
        properties: std::collections::HashMap<String, PageProperty>,
        children: Vec<notionrs_types::object::block::Block>,
    ) -> Result<PageResponse, AnkiRepositoryError>;

    async fn update_anki(
        &self,
        page_id: &str,
        properties: std::collections::HashMap<String, PageProperty>,
        in_trash: Option<bool>,
    ) -> Result<PageResponse, AnkiRepositoryError>;

    async fn list_blocks_by_id(
        &self,
        page_id: &str,
    ) -> Result<n2a2ui_a2ui::v0_9::Surface, AnkiRepositoryError>;
}

pub struct AnkiRepositoryImpl {}

#[async_trait::async_trait]
impl AnkiRepository for AnkiRepositoryImpl {
    async fn get_anki_by_id(&self, id: &str) -> Result<PageResponse, AnkiRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let request = notionrs_client.get_page().page_id(id);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| AnkiRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn list_anki(
        &self,
        page_size: u32,
        next_cursor: Option<String>,
    ) -> Result<notionrs_types::object::response::ListResponse<PageResponse>, AnkiRepositoryError>
    {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/anki/data_source/id"
        ))
        .await?;

        let sorts = vec![Sort::asc("nextReviewAt")];

        let mut request = notionrs_client
            .query_data_source()
            .data_source_id(data_source_id)
            .sorts(sorts)
            .page_size(page_size);

        if let Some(next_cursor) = next_cursor {
            request = request.start_cursor(next_cursor);
        }

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| AnkiRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn create_anki(
        &self,
        properties: std::collections::HashMap<String, PageProperty>,
        children: Vec<notionrs_types::object::block::Block>,
    ) -> Result<PageResponse, AnkiRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let stage_name = http_api_core::cache::get_or_init_stage_name().await?;
        let data_source_id = http_api_core::cache::get_parameter(format!(
            "/{stage_name}/46ki75/internal/notion/anki/data_source/id"
        ))
        .await?;

        let request = notionrs_client
            .create_page()
            .data_source_id(data_source_id)
            .properties(properties)
            .children(children);

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| AnkiRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn update_anki(
        &self,
        page_id: &str,
        properties: std::collections::HashMap<String, PageProperty>,
        in_trash: Option<bool>,
    ) -> Result<PageResponse, AnkiRepositoryError> {
        let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

        let request = match in_trash {
            Some(in_trash) => notionrs_client
                .update_page()
                .page_id(page_id)
                .properties(properties)
                .in_trash(in_trash),
            None => notionrs_client
                .update_page()
                .page_id(page_id)
                .properties(properties),
        };

        tracing::debug!("Sending request to Notion API");
        let response = request
            .send()
            .await
            .map_err(|e| AnkiRepositoryError::NotionApi(e.to_string()))?;

        Ok(response)
    }

    async fn list_blocks_by_id(
        &self,
        page_id: &str,
    ) -> Result<n2a2ui_a2ui::v0_9::Surface, AnkiRepositoryError> {
        let client = http_api_core::cache::get_or_init_n2a2ui_client().await?;

        tracing::debug!("Sending request to Notion API");
        let surface = client.convert_block(page_id).await?;

        Ok(surface)
    }
}

pub struct AnkiRepositoryStub;

#[async_trait::async_trait]
impl AnkiRepository for AnkiRepositoryStub {
    async fn get_anki_by_id(&self, _id: &str) -> Result<PageResponse, AnkiRepositoryError> {
        let user = notionrs_types::object::user::User {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            ..Default::default()
        };

        let mut properties = std::collections::HashMap::new();

        let title_property = PageProperty::Title(PageTitleProperty::from("title".to_string()));
        properties.insert("title".to_string(), title_property);

        let description_property =
            PageProperty::RichText(PageRichTextProperty::from("description".to_string()));
        properties.insert("description".to_string(), description_property);

        let ease_factor_property = PageProperty::Number(PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property = PageProperty::Number(PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property = PageProperty::Date(PageDateProperty::from(
            notionrs_types::object::date::DateOrDateTime::DateTime(
                time::OffsetDateTime::parse(
                    "2022-06-28T00:00:00Z",
                    &time::format_description::well_known::Rfc3339,
                )
                .unwrap(),
            ),
        ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = PageProperty::MultiSelect(PageMultiSelectProperty::default());
        properties.insert("tags".to_string(), tags_property);

        properties.insert(
            "isReviewRequired".to_owned(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );

        Ok(PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
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
        })
    }

    async fn list_anki(
        &self,
        _page_size: u32,
        _next_cursor: Option<String>,
    ) -> Result<notionrs_types::object::response::ListResponse<PageResponse>, AnkiRepositoryError>
    {
        let user = notionrs_types::object::user::User {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            ..Default::default()
        };

        let mut properties = std::collections::HashMap::new();

        let title_property = PageProperty::Title(PageTitleProperty::from("title".to_string()));
        properties.insert("title".to_string(), title_property);

        let description_property =
            PageProperty::RichText(PageRichTextProperty::from("description".to_string()));
        properties.insert("description".to_string(), description_property);

        let ease_factor_property = PageProperty::Number(PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property = PageProperty::Number(PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property = PageProperty::Date(PageDateProperty::from(
            notionrs_types::object::date::DateOrDateTime::DateTime(
                time::OffsetDateTime::parse(
                    "2022-06-28T00:00:00Z",
                    &time::format_description::well_known::Rfc3339,
                )
                .unwrap(),
            ),
        ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = PageProperty::MultiSelect(PageMultiSelectProperty::default());
        properties.insert("tags".to_string(), tags_property);

        properties.insert(
            "isReviewRequired".to_owned(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );

        let page = PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
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
        };

        Ok(notionrs_types::object::response::ListResponse {
            object: "list".to_string(),
            results: vec![page],
            next_cursor: None,
            has_more: Some(false),
            r#type: Some("page".to_string()),
            request_status: None,
        })
    }

    async fn create_anki(
        &self,
        properties: std::collections::HashMap<String, PageProperty>,
        _children: Vec<notionrs_types::object::block::Block>,
    ) -> Result<PageResponse, AnkiRepositoryError> {
        let mut properties = properties.clone();

        let title_property = PageProperty::Title(PageTitleProperty::from("title".to_string()));
        properties.insert("title".to_string(), title_property);

        let description_property =
            PageProperty::RichText(PageRichTextProperty::from("description".to_string()));
        properties.insert("description".to_string(), description_property);

        let ease_factor_property = PageProperty::Number(PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property = PageProperty::Number(PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property = PageProperty::Date(PageDateProperty::from(
            notionrs_types::object::date::DateOrDateTime::DateTime(
                time::OffsetDateTime::parse(
                    "2022-06-28T00:00:00Z",
                    &time::format_description::well_known::Rfc3339,
                )
                .unwrap(),
            ),
        ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = PageProperty::MultiSelect(PageMultiSelectProperty::default());
        properties.insert("tags".to_string(), tags_property);

        properties.insert(
            "isReviewRequired".to_owned(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );

        let user = notionrs_types::object::user::User {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            ..Default::default()
        };

        Ok(PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
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
        })
    }

    async fn update_anki(
        &self,
        page_id: &str,
        properties: std::collections::HashMap<String, PageProperty>,
        in_trash: Option<bool>,
    ) -> Result<PageResponse, AnkiRepositoryError> {
        let mut properties = properties.clone();

        let title_property = PageProperty::Title(PageTitleProperty::from("title".to_string()));
        properties.insert("title".to_string(), title_property);

        let description_property =
            PageProperty::RichText(PageRichTextProperty::from("description".to_string()));
        properties.insert("description".to_string(), description_property);

        let ease_factor_property = PageProperty::Number(PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property = PageProperty::Number(PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property = PageProperty::Date(PageDateProperty::from(
            notionrs_types::object::date::DateOrDateTime::DateTime(
                time::OffsetDateTime::parse(
                    "2022-06-28T00:00:00Z",
                    &time::format_description::well_known::Rfc3339,
                )
                .unwrap(),
            ),
        ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = PageProperty::MultiSelect(PageMultiSelectProperty::default());
        properties.insert("tags".to_string(), tags_property);

        properties.insert(
            "isReviewRequired".to_owned(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );

        let user = notionrs_types::object::user::User {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            ..Default::default()
        };

        Ok(PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
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
                    page_id: page_id.to_string(),
                },
            ),
            #[allow(deprecated)]
            archived: false,
            properties,
            url: "https://www.notion.com/".to_string(),
            public_url: None,
            developer_survey: None,
            request_id: None,
            in_trash: in_trash.unwrap_or_default(),
            is_locked: false,
            is_archived: false,
        })
    }

    async fn list_blocks_by_id(
        &self,
        _page_id: &str,
    ) -> Result<n2a2ui_a2ui::v0_9::Surface, AnkiRepositoryError> {
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
