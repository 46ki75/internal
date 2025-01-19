#[derive(Default)]
pub struct ToDoMutation;

#[derive(async_graphql::InputObject, Debug)]
pub struct CreateToDoInput {
    pub title: String,
    pub description: Option<String>,
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

        let CreateToDoInput { title, description } = input;

        let properties = {
            let mut properties = std::collections::HashMap::new();

            properties.insert(
                "Type".to_string(),
                notionrs::page::properties::PageProperty::Select(
                    notionrs::page::properties::PageSelectProperty::from("ToDo"),
                ),
            );

            properties.insert(
                "Sevelity".to_string(),
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

            if let Some(description) = description.clone() {
                properties.insert(
                    "Description".to_string(),
                    notionrs::page::properties::PageProperty::RichText(
                        notionrs::page::properties::PageRichTextProperty::from(description),
                    ),
                );
            }

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
            description,
            source: "Notion:todo".to_string(),
            is_done: false,
            deadline: None,
            severity: super::Sevelity::Info,
            created_at: Some(response.created_time.to_rfc3339()),
            updated_at: Some(response.last_edited_time.to_rfc3339()),
        })
    }
}
