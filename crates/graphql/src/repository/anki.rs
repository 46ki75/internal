#[async_trait::async_trait]
pub trait AnkiRepository: Send + Sync {
    async fn get_anki_by_id(
        &self,
        id: &str,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error>;

    async fn list_anki(
        &self,
        page_size: u32,
        next_cursor: Option<String>,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::PageResponse>,
        crate::error::Error,
    >;

    async fn create_anki(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::PageProperty>,
        children: Vec<notionrs::block::Block>,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error>;

    async fn update_anki(
        &self,
        page_id: &str,
        properties: std::collections::HashMap<String, notionrs::page::PageProperty>,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error>;

    async fn list_blocks_by_id(
        &self,
        page_id: &str,
    ) -> Result<Vec<elmethis_notion::block::Block>, crate::error::Error>;
}

pub struct AnkiRepositoryImpl {
    pub config: std::sync::Arc<crate::config::Config>,
}

#[async_trait::async_trait]
impl AnkiRepository for AnkiRepositoryImpl {
    async fn get_anki_by_id(
        &self,
        id: &str,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error> {
        let request = self.config.notion_client.get_page().page_id(id);

        log::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn list_anki(
        &self,
        page_size: u32,
        next_cursor: Option<String>,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::PageResponse>,
        crate::error::Error,
    > {
        let database_id = self.config.notion_anki_database_id.as_str();

        let sorts = vec![notionrs::database::Sort::asc("nextReviewAt")];

        let mut request = self
            .config
            .notion_client
            .query_database()
            .database_id(database_id)
            .sorts(sorts)
            .page_size(page_size);

        if let Some(next_cursor) = next_cursor {
            request = request.start_cursor(next_cursor);
        }

        log::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn create_anki(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::PageProperty>,
        children: Vec<notionrs::block::Block>,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error> {
        let database_id = self.config.notion_anki_database_id.as_str();

        let request = self
            .config
            .notion_client
            .create_page()
            .database_id(database_id)
            .properties(properties)
            .children(children);

        log::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn update_anki(
        &self,
        page_id: &str,
        properties: std::collections::HashMap<String, notionrs::page::PageProperty>,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error> {
        let request = self
            .config
            .notion_client
            .update_page()
            .page_id(page_id)
            .properties(properties);

        log::debug!("Sending request to Notion API");
        let response = request.send().await.map_err(|e| {
            let error_message = format!("Notion API error: {}", e);
            log::error!("{}", error_message);
            crate::error::Error::NotionRs(error_message)
        })?;

        Ok(response)
    }

    async fn list_blocks_by_id(
        &self,
        page_id: &str,
    ) -> Result<Vec<elmethis_notion::block::Block>, crate::error::Error> {
        let secret = self.config.notion_api_key.as_str();

        let mut client = elmethis_notion::client::Client::new(secret);

        log::debug!("Sending request to Notion API");
        let blocks = client.convert_block(page_id).await?;

        Ok(blocks)
    }
}

pub struct AnkiRepositoryStub;

#[async_trait::async_trait]
impl AnkiRepository for AnkiRepositoryStub {
    async fn get_anki_by_id(
        &self,
        _id: &str,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error> {
        let user = notionrs::User::Person(notionrs::Person {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            name: None,
            avatar_url: None,
            r#type: None,
            person: None,
        });

        let mut properties = std::collections::HashMap::new();

        let title_property = notionrs::page::PageProperty::Title(
            notionrs::page::PageTitleProperty::from("title".to_string()),
        );
        properties.insert("title".to_string(), title_property);

        let description_property = notionrs::page::PageProperty::RichText(
            notionrs::page::PageRichTextProperty::from("description".to_string()),
        );
        properties.insert("description".to_string(), description_property);

        let ease_factor_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property =
            notionrs::page::PageProperty::Date(notionrs::page::PageDateProperty::from(
                chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = notionrs::page::PageProperty::MultiSelect(
            notionrs::page::PageMultiSelectProperty::default(),
        );
        properties.insert("tags".to_string(), tags_property);

        Ok(notionrs::page::PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
            created_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            last_edited_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            created_by: user.clone(),
            last_edited_by: user,
            cover: None,
            icon: None,
            parent: notionrs::others::parent::Parent::PageParent(
                notionrs::others::parent::PageParent {
                    r#type: "page_id".to_string(),
                    page_id: "7e39472a-dfeb-41c9-a97c-f66c85e9dafe".to_string(),
                },
            ),
            archived: false,
            properties,
            url: "https://www.notion.com/".to_string(),
            public_url: None,
            developer_survey: None,
            request_id: None,
            in_trash: false,
        })
    }

    async fn list_anki(
        &self,
        _page_size: u32,
        _next_cursor: Option<String>,
    ) -> Result<
        notionrs::list_response::ListResponse<notionrs::page::PageResponse>,
        crate::error::Error,
    > {
        let user = notionrs::User::Person(notionrs::Person {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            name: None,
            avatar_url: None,
            r#type: None,
            person: None,
        });

        let mut properties = std::collections::HashMap::new();

        let title_property = notionrs::page::PageProperty::Title(
            notionrs::page::PageTitleProperty::from("title".to_string()),
        );
        properties.insert("title".to_string(), title_property);

        let description_property = notionrs::page::PageProperty::RichText(
            notionrs::page::PageRichTextProperty::from("description".to_string()),
        );
        properties.insert("description".to_string(), description_property);

        let ease_factor_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property =
            notionrs::page::PageProperty::Date(notionrs::page::PageDateProperty::from(
                chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = notionrs::page::PageProperty::MultiSelect(
            notionrs::page::PageMultiSelectProperty::default(),
        );
        properties.insert("tags".to_string(), tags_property);

        let page = notionrs::page::PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
            created_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            last_edited_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            created_by: user.clone(),
            last_edited_by: user,
            cover: None,
            icon: None,
            parent: notionrs::others::parent::Parent::PageParent(
                notionrs::others::parent::PageParent {
                    r#type: "page_id".to_string(),
                    page_id: "7e39472a-dfeb-41c9-a97c-f66c85e9dafe".to_string(),
                },
            ),
            archived: false,
            properties,
            url: "https://www.notion.com/".to_string(),
            public_url: None,
            developer_survey: None,
            request_id: None,
            in_trash: false,
        };

        Ok(notionrs::list_response::ListResponse {
            object: "list".to_string(),
            results: vec![page],
            next_cursor: None,
            has_more: Some(false),
            r#type: Some("page".to_string()),
        })
    }

    async fn create_anki(
        &self,
        properties: std::collections::HashMap<String, notionrs::page::PageProperty>,
        _children: Vec<notionrs::block::Block>,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error> {
        let mut properties = properties.clone();

        let title_property = notionrs::page::PageProperty::Title(
            notionrs::page::PageTitleProperty::from("title".to_string()),
        );
        properties.insert("title".to_string(), title_property);

        let description_property = notionrs::page::PageProperty::RichText(
            notionrs::page::PageRichTextProperty::from("description".to_string()),
        );
        properties.insert("description".to_string(), description_property);

        let ease_factor_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property =
            notionrs::page::PageProperty::Date(notionrs::page::PageDateProperty::from(
                chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = notionrs::page::PageProperty::MultiSelect(
            notionrs::page::PageMultiSelectProperty::default(),
        );
        properties.insert("tags".to_string(), tags_property);

        let user = notionrs::User::Person(notionrs::Person {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            name: None,
            avatar_url: None,
            r#type: None,
            person: None,
        });

        Ok(notionrs::page::PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
            created_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            last_edited_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            created_by: user.clone(),
            last_edited_by: user,
            cover: None,
            icon: None,
            parent: notionrs::others::parent::Parent::PageParent(
                notionrs::others::parent::PageParent {
                    r#type: "page_id".to_string(),
                    page_id: "7e39472a-dfeb-41c9-a97c-f66c85e9dafe".to_string(),
                },
            ),
            archived: false,
            properties,
            url: "https://www.notion.com/".to_string(),
            public_url: None,
            developer_survey: None,
            request_id: None,
            in_trash: false,
        })
    }

    async fn update_anki(
        &self,
        page_id: &str,
        properties: std::collections::HashMap<String, notionrs::page::PageProperty>,
    ) -> Result<notionrs::page::PageResponse, crate::error::Error> {
        let mut properties = properties.clone();

        let title_property = notionrs::page::PageProperty::Title(
            notionrs::page::PageTitleProperty::from("title".to_string()),
        );
        properties.insert("title".to_string(), title_property);

        let description_property = notionrs::page::PageProperty::RichText(
            notionrs::page::PageRichTextProperty::from("description".to_string()),
        );
        properties.insert("description".to_string(), description_property);

        let ease_factor_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(2.5));
        properties.insert("easeFactor".to_string(), ease_factor_property);

        let repetition_count_property =
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(5));
        properties.insert("repetitionCount".to_string(), repetition_count_property);

        let next_review_at_property =
            notionrs::page::PageProperty::Date(notionrs::page::PageDateProperty::from(
                chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            ));
        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let tags_property = notionrs::page::PageProperty::MultiSelect(
            notionrs::page::PageMultiSelectProperty::default(),
        );
        properties.insert("tags".to_string(), tags_property);

        let user = notionrs::User::Person(notionrs::Person {
            object: "user".to_string(),
            id: "c4afec03-71d3-4114-b992-df84ed2e594c".to_string(),
            name: None,
            avatar_url: None,
            r#type: None,
            person: None,
        });

        Ok(notionrs::page::PageResponse {
            id: "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e".to_string(),
            created_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            last_edited_time: chrono::DateTime::parse_from_rfc3339("2022-06-28T00:00:00Z").unwrap(),
            created_by: user.clone(),
            last_edited_by: user,
            cover: None,
            icon: None,
            parent: notionrs::others::parent::Parent::PageParent(
                notionrs::others::parent::PageParent {
                    r#type: "page_id".to_string(),
                    page_id: page_id.to_string(),
                },
            ),
            archived: false,
            properties,
            url: "https://www.notion.com/".to_string(),
            public_url: None,
            developer_survey: None,
            request_id: None,
            in_trash: false,
        })
    }

    async fn list_blocks_by_id(
        &self,
        _page_id: &str,
    ) -> Result<Vec<elmethis_notion::block::Block>, crate::error::Error> {
        let blocks = vec![];

        Ok(blocks)
    }
}
