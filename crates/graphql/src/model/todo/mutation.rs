#[derive(Default)]
pub struct ToDoMutation;

#[derive(async_graphql::InputObject, Debug)]
pub struct CreateToDoInput {
    pub title: String,
}

#[derive(async_graphql::InputObject, Debug)]
pub struct UpdateToDoInput {
    pub id: String,
    pub is_done: bool,
}

#[async_graphql::Object]
impl ToDoMutation {
    pub async fn create_todo(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: CreateToDoInput,
    ) -> Result<super::ToDo, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_TODO_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_TODO_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let CreateToDoInput { title } = input;

        let properties = {
            let mut properties = std::collections::HashMap::new();

            properties.insert(
                "Type".to_string(),
                notionrs::page::properties::PageProperty::Select(
                    notionrs::page::properties::PageSelectProperty::from("todo"),
                ),
            );

            properties.insert(
                "Severity".to_string(),
                notionrs::page::properties::PageProperty::Select(
                    notionrs::page::properties::PageSelectProperty::from("INFO"),
                ),
            );

            properties.insert(
                "Title".to_string(),
                notionrs::page::properties::PageProperty::Title(
                    notionrs::page::properties::PageTitleProperty::from(title.clone()),
                ),
            );

            properties
        };

        let request = client
            .create_page()
            .database_id(database_id)
            .properties(properties);

        let response = request.send().await?;

        Ok(super::ToDo {
            id: response.id,
            url: response.url,
            title,
            description: None,
            source: "Notion:todo".to_string(),
            is_done: false,
            deadline: None,
            severity: super::Severity::Info,
            created_at: Some(response.created_time.to_rfc3339()),
            updated_at: Some(response.last_edited_time.to_rfc3339()),
        })
    }

    pub async fn update_todo(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: UpdateToDoInput,
    ) -> Result<super::ToDo, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let UpdateToDoInput { id, is_done } = input;

        let mut properties = std::collections::HashMap::new();

        properties.insert(
            "IsDone".to_string(),
            notionrs::page::properties::PageProperty::Checkbox(
                notionrs::page::properties::PageCheckboxProperty::from(is_done),
            ),
        );

        let request = client.update_page().page_id(&id).properties(properties);

        let response = request.send().await?;

        let properties = response.properties;

        let title_property = properties.get("Title").ok_or("Title not found")?;

        let title = if let notionrs::page::PageProperty::Title(title) = title_property {
            Ok(title.to_string())
        } else {
            Err(async_graphql::Error::from("Title not found"))
        }?;

        let serverity_property = properties.get("Severity").ok_or("Severitynot found")?;

        let severity = if let notionrs::page::PageProperty::Select(severity) = serverity_property {
            let select_name_str = severity.to_string();
            Ok(if select_name_str == "INFO" {
                super::Severity::Info
            } else if select_name_str == "WARN" {
                super::Severity::Warn
            } else if select_name_str == "ERROR" {
                super::Severity::Error
            } else if select_name_str == "FATAL" {
                super::Severity::Fatal
            } else {
                super::Severity::Unknown
            })
        } else {
            Err(async_graphql::Error::from("Severitynot found"))
        }?;

        Ok(super::ToDo {
            id: response.id,
            url: response.url,
            source: "Notion:todo".to_string(),
            title,
            description: None,
            is_done,
            deadline: None,
            severity,
            created_at: Some(response.created_time.to_rfc3339()),
            updated_at: Some(response.last_edited_time.to_rfc3339()),
        })
    }
}
