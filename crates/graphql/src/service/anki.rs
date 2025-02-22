pub struct AnkiService {
    anki_repository: std::sync::Arc<dyn crate::repository::anki::AnkiRepository + Send + Sync>,
}

impl AnkiService {
    pub async fn list_blocks(
        &self,
        id: &str,
    ) -> Result<crate::model::anki::AnkiBlock, crate::error::Error> {
        let blocks = self.anki_repository.list_blocks_by_id(id).await?;

        let mut front: Vec<elmethis_notion::block::Block> = Vec::new();
        let mut back: Vec<elmethis_notion::block::Block> = Vec::new();
        let mut explanation: Vec<elmethis_notion::block::Block> = Vec::new();

        enum Marker {
            Front,
            Back,
            Explanation,
        }

        let mut marker = Marker::Front;

        for block in blocks {
            if let elmethis_notion::block::Block::ElmHeading1(
                elmethis_notion::block::ElmHeading1 { props },
            ) = &block
            {
                if props.text == "front" {
                    marker = Marker::Front;
                    continue;
                } else if props.text == "back" {
                    marker = Marker::Back;
                    continue;
                } else if props.text == "explanation" {
                    marker = Marker::Explanation;
                    continue;
                }
            }

            match marker {
                Marker::Front => front.push(block),
                Marker::Back => back.push(block),
                Marker::Explanation => explanation.push(block),
            }
        }

        Ok(crate::model::anki::AnkiBlock {
            front: serde_json::to_value(front)?,
            back: serde_json::to_value(back)?,
            explanation: serde_json::to_value(explanation)?,
        })
    }

    pub async fn create_anki(
        &self,
        title: &str,
    ) -> Result<crate::model::anki::Anki, crate::error::Error> {
        let mut properties: std::collections::HashMap<String, notionrs::page::PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "title".to_string(),
            notionrs::page::PageProperty::Title(notionrs::page::PageTitleProperty::from(
                title.to_string(),
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

        let next_review_at = chrono::Utc::now().with_timezone(
            &chrono::FixedOffset::east_opt(9).ok_or(crate::error::Error::InvalidTimezone)?,
        );

        let next_review_at_property = notionrs::page::PageProperty::Date(
            notionrs::page::PageDateProperty::default()
                .start(next_review_at)
                .clone(),
        );

        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let children = vec![
            notionrs::block::Block::Heading1 {
                heading_1: notionrs::block::heading::HeadingBlock::default()
                    .rich_text(vec![notionrs::others::rich_text::RichText::from("front")
                        .color(notionrs::others::color::Color::Brown)]),
            },
            notionrs::block::Block::Paragraph {
                paragraph: notionrs::block::paragraph::ParagraphBlock::from(""),
            },
            notionrs::block::Block::Heading1 {
                heading_1: notionrs::block::heading::HeadingBlock::default()
                    .rich_text(vec![notionrs::others::rich_text::RichText::from("back")
                        .color(notionrs::others::color::Color::Brown)]),
            },
            notionrs::block::Block::Paragraph {
                paragraph: notionrs::block::paragraph::ParagraphBlock::from(""),
            },
            notionrs::block::Block::Heading1 {
                heading_1: notionrs::block::heading::HeadingBlock::default().rich_text(vec![
                    notionrs::others::rich_text::RichText::from("explanation")
                        .color(notionrs::others::color::Color::Brown),
                ]),
            },
            notionrs::block::Block::Paragraph {
                paragraph: notionrs::block::paragraph::ParagraphBlock::from(""),
            },
        ];

        let page_response = self
            .anki_repository
            .create_anki(properties, children)
            .await?;

        let anki = crate::util::anki::AnkiUtil::convert_page_response(page_response)?;

        Ok(anki)
    }

    pub async fn update_anki(
        &self,
        page_id: String,
        ease_factor: f64,
        repetition_count: u32,
        next_review_at: String,
    ) -> Result<crate::model::anki::Anki, crate::error::Error> {
        let mut properties: std::collections::HashMap<String, notionrs::page::PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "easeFactor".to_string(),
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(
                ease_factor,
            )),
        );

        properties.insert(
            "repetitionCount".to_string(),
            notionrs::page::PageProperty::Number(notionrs::page::PageNumberProperty::from(
                repetition_count,
            )),
        );

        let next_review_at = chrono::DateTime::parse_from_rfc3339(&next_review_at)?;

        let next_review_at_property = notionrs::page::PageProperty::Date(
            notionrs::page::PageDateProperty::default()
                .start(next_review_at)
                .clone(),
        );

        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let page_response = self
            .anki_repository
            .update_anki(&page_id, properties)
            .await?;

        let anki = crate::util::anki::AnkiUtil::convert_page_response(page_response)?;

        Ok(anki)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::anki::AnkiRepositoryStub;

    #[tokio::test]
    async fn separate_blocks() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_service = AnkiService {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_service
            .list_blocks("28b8e5f3-ba43-44a8-b790-bfc8c62b7628")
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn create_anki() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_service = AnkiService {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_service.create_anki("title").await.unwrap();
    }

    #[tokio::test]
    async fn update_anki() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_service = AnkiService {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_service
            .update_anki(
                "28b8e5f3-ba43-44a8-b790-bfc8c62b7628".to_string(),
                2.5,
                0,
                "2021-09-01T00:00:00+09:00".to_string(),
            )
            .await
            .unwrap();
    }
}
