#[derive(Default)]
pub struct AnkiMutation;

#[derive(async_graphql::InputObject)]
pub struct CreateAnkiInput {
    title: Option<String>,
}

#[derive(async_graphql::InputObject)]
pub struct UpdateAnkiInput {
    page_id: String,
    ease_factor: f64,
    repetition_count: u32,
    next_review_at: String,
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

        let children = vec![
            notionrs::block::Block::Heading1 {
                heading_1: notionrs::block::heading::HeadingBlock::default()
                    .rich_text(vec![notionrs::others::rich_text::RichText::from("Front")
                        .color(notionrs::others::color::Color::Brown)]),
            },
            notionrs::block::Block::Paragraph {
                paragraph: notionrs::block::paragraph::ParagraphBlock::from(""),
            },
            notionrs::block::Block::Heading1 {
                heading_1: notionrs::block::heading::HeadingBlock::default()
                    .rich_text(vec![notionrs::others::rich_text::RichText::from("Back")
                        .color(notionrs::others::color::Color::Brown)]),
            },
            notionrs::block::Block::Paragraph {
                paragraph: notionrs::block::paragraph::ParagraphBlock::from(""),
            },
            notionrs::block::Block::Heading1 {
                heading_1: notionrs::block::heading::HeadingBlock::default().rich_text(vec![
                    notionrs::others::rich_text::RichText::from("Explanation")
                        .color(notionrs::others::color::Color::Brown),
                ]),
            },
            notionrs::block::Block::Paragraph {
                paragraph: notionrs::block::paragraph::ParagraphBlock::from(""),
            },
        ];

        let request = client
            .create_page()
            .database_id(database_id)
            .properties(properties)
            .children(children);

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

    pub async fn update_anki(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: UpdateAnkiInput,
    ) -> Result<super::Anki, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let mut properties: std::collections::HashMap<String, notionrs::page::PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "easeFactor".to_string(),
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(
                input.ease_factor,
            )),
        );

        properties.insert(
            "repetitionCount".to_string(),
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(
                input.repetition_count,
            )),
        );

        let next_review_at = chrono::DateTime::parse_from_rfc3339(&input.next_review_at)
            .map_err(|_| async_graphql::Error::from("Invalid next_review_at"))?;

        let next_review_at_property = notionrs::page::PageProperty::Date(
            notionrs::page::PageDateProperty::default()
                .start(next_review_at)
                .clone(),
        );

        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let request = client
            .update_page()
            .page_id(input.page_id)
            .properties(properties);

        let response = request.send().await?;

        let anki = super::Anki {
            page_id: response.id,
            title: None,
            description: None,
            ease_factor: input.ease_factor,
            repetition_count: input.repetition_count,
            next_review_at: next_review_at.to_rfc3339(),
            created_at: response.created_time.to_rfc3339(),
            updated_at: response.last_edited_time.to_rfc3339(),
            tags: vec![],
            url: response.url,
        };

        Ok(anki)
    }
}
