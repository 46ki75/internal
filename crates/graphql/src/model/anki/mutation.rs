#[derive(Default)]
pub struct AnkiMutation;

#[derive(async_graphql::InputObject)]
pub struct CreateAnkiInput {
    title: Option<String>,
}

#[async_graphql::Object]
impl AnkiMutation {
    pub async fn create_anki(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: CreateAnkiInput,
    ) -> Result<super::Anki, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_ANKI_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_ANKI_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let mut properties: std::collections::HashMap<String, notionrs::page::PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "title".to_string(),
            notionrs::page::PageProperty::Title(notionrs::page::PageTitleProperty::from(
                input.title.clone().unwrap_or("".to_string()),
            )),
        );

        let ease_factor = 2.5;

        properties.insert(
            "easeFactor".to_string(),
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(
                ease_factor,
            )),
        );

        properties.insert(
            "repetitionCount".to_string(),
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(0)),
        );

        let next_review_at = chrono::Utc::now()
            .with_timezone(&chrono::FixedOffset::east_opt(9).ok_or("Invalid timezone")?);

        let next_review_at_property = notionrs::page::PageProperty::Date(
            notionrs::page::PageDateProperty::default()
                .start(next_review_at)
                .clone(),
        );

        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let request = client
            .create_page()
            .database_id(database_id)
            .properties(properties);

        let response = request.send().await?;

        let anki = super::Anki {
            page_id: response.id,
            title: input.title,
            description: None,
            ease_factor,
            repetition_count: 0,
            next_review_at: next_review_at.to_rfc3339(),
            created_at: response.created_time.to_rfc3339(),
            updated_at: response.last_edited_time.to_rfc3339(),
            tags: vec![],
            url: response.url,
        };

        Ok(anki)
    }
}
