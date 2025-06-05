use notionrs_types::prelude::*;

pub struct AnkiService {
    pub anki_repository: std::sync::Arc<dyn crate::repository::anki::AnkiRepository + Send + Sync>,
}

impl AnkiService {
    pub async fn get_anki_by_id(
        &self,
        id: &str,
    ) -> Result<crate::entity::anki::AnkiEntity, crate::error::Error> {
        let page = self.anki_repository.get_anki_by_id(id).await?;

        let anki = crate::util::anki::AnkiUtil::convert_page_response(page)?;

        Ok(anki)
    }

    pub async fn list_anki(
        &self,
        page_size: u32,
        next_cursor: Option<String>,
    ) -> Result<(Vec<crate::entity::anki::AnkiEntity>, Option<String>), crate::error::Error> {
        let pages = self
            .anki_repository
            .list_anki(page_size, next_cursor)
            .await?;

        let anki_list = pages
            .results
            .into_iter()
            .map(crate::util::anki::AnkiUtil::convert_page_response)
            .collect::<Result<Vec<crate::entity::anki::AnkiEntity>, crate::error::Error>>()?;

        let next_cursor = pages.next_cursor;

        Ok((anki_list, next_cursor))
    }

    pub async fn list_blocks(
        &self,
        id: &str,
    ) -> Result<crate::entity::anki::AnkiBlockEntity, crate::error::Error> {
        let blocks = self.anki_repository.list_blocks_by_id(id).await?;

        let mut front: Vec<jarkup_rs::Component> = Vec::new();
        let mut back: Vec<jarkup_rs::Component> = Vec::new();
        let mut explanation: Vec<jarkup_rs::Component> = Vec::new();

        enum Marker {
            Front,
            Back,
            Explanation,
        }

        let mut marker = Marker::Front;

        for block in blocks {
            if let jarkup_rs::Component::BlockComponent(block_component) = &block {
                if let jarkup_rs::BlockComponent::Heading(heading) = &block_component {
                    if heading.props.level == jarkup_rs::HeadingLevel::H1 {
                        let text = heading
                            .slots
                            .default
                            .clone()
                            .into_iter()
                            .filter_map(|slot| {
                                if let jarkup_rs::InlineComponent::Text(text) = slot {
                                    Some(text.props.text)
                                } else {
                                    None
                                }
                            })
                            .collect::<String>()
                            .trim()
                            .to_lowercase();

                        let text_str = text.as_str();

                        if text_str == "front" {
                            marker = Marker::Front;
                            continue;
                        } else if text_str == "back" {
                            marker = Marker::Back;
                            continue;
                        } else if text_str == "explanation" {
                            marker = Marker::Explanation;
                            continue;
                        }
                    }
                }

                match marker {
                    Marker::Front => front.push(block),
                    Marker::Back => back.push(block),
                    Marker::Explanation => explanation.push(block),
                }
            }
        }

        Ok(crate::entity::anki::AnkiBlockEntity {
            front: serde_json::to_value(front)?,
            back: serde_json::to_value(back)?,
            explanation: serde_json::to_value(explanation)?,
        })
    }

    pub async fn create_anki(
        &self,
        title: Option<String>,
    ) -> Result<crate::entity::anki::AnkiEntity, crate::error::Error> {
        let mut properties: std::collections::HashMap<String, PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "title".to_string(),
            PageProperty::Title(PageTitleProperty::from(
                title.unwrap_or("No Title".to_string()),
            )),
        );

        let ease_factor = 2.5;

        properties.insert(
            "easeFactor".to_string(),
            PageProperty::Number(PageNumberProperty::from(ease_factor)),
        );

        properties.insert(
            "repetitionCount".to_string(),
            PageProperty::Number(PageNumberProperty::from(0)),
        );

        let next_review_at = time::OffsetDateTime::now_utc();

        let next_review_at_property = PageProperty::Date(
            PageDateProperty::default()
                .start(notionrs_types::object::date::DateOrDateTime::DateTime(
                    next_review_at,
                ))
                .clone(),
        );

        properties.insert("nextReviewAt".to_string(), next_review_at_property);

        let children = vec![
            notionrs_types::object::block::Block::Heading1 {
                heading_1: notionrs_types::object::block::heading::HeadingBlock::default()
                    .rich_text(vec![
                        notionrs_types::object::rich_text::RichText::from("front")
                            .color(notionrs_types::object::color::Color::Brown),
                    ]),
            },
            notionrs_types::object::block::Block::Paragraph {
                paragraph: notionrs_types::object::block::paragraph::ParagraphBlock::from(""),
            },
            notionrs_types::object::block::Block::Heading1 {
                heading_1: notionrs_types::object::block::heading::HeadingBlock::default()
                    .rich_text(vec![
                        notionrs_types::object::rich_text::RichText::from("back")
                            .color(notionrs_types::object::color::Color::Brown),
                    ]),
            },
            notionrs_types::object::block::Block::Paragraph {
                paragraph: notionrs_types::object::block::paragraph::ParagraphBlock::from(""),
            },
            notionrs_types::object::block::Block::Heading1 {
                heading_1: notionrs_types::object::block::heading::HeadingBlock::default()
                    .rich_text(vec![
                        notionrs_types::object::rich_text::RichText::from("explanation")
                            .color(notionrs_types::object::color::Color::Brown),
                    ]),
            },
            notionrs_types::object::block::Block::Paragraph {
                paragraph: notionrs_types::object::block::paragraph::ParagraphBlock::from(""),
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
        page_id: &str,
        ease_factor: Option<f64>,
        repetition_count: Option<u32>,
        next_review_at: Option<String>,
    ) -> Result<crate::entity::anki::AnkiEntity, crate::error::Error> {
        let mut properties: std::collections::HashMap<String, PageProperty> =
            std::collections::HashMap::new();

        if let Some(ease_factor) = ease_factor {
            properties.insert(
                "easeFactor".to_string(),
                PageProperty::Number(PageNumberProperty::from(ease_factor)),
            );
        };

        if let Some(repetition_count) = repetition_count {
            properties.insert(
                "repetitionCount".to_string(),
                PageProperty::Number(PageNumberProperty::from(repetition_count)),
            );
        };

        if let Some(next_review_at) = next_review_at {
            let next_review_at = time::OffsetDateTime::parse(
                &next_review_at,
                &time::format_description::well_known::Rfc3339,
            )?;

            let next_review_at_property = PageProperty::Date(
                PageDateProperty::default()
                    .start(notionrs_types::object::date::DateOrDateTime::DateTime(
                        next_review_at,
                    ))
                    .clone(),
            );

            properties.insert("nextReviewAt".to_string(), next_review_at_property);
        };

        let page_response = self
            .anki_repository
            .update_anki(page_id, properties)
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

        let _ = anki_service
            .create_anki(Some("title".to_string()))
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn update_anki() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_service = AnkiService {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_service
            .update_anki(
                "28b8e5f3-ba43-44a8-b790-bfc8c62b7628",
                Some(2.5),
                Some(0),
                Some("2021-09-01T00:00:00+09:00".to_string()),
            )
            .await
            .unwrap();
    }
}
