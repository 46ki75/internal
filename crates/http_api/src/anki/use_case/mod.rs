pub mod input;
pub mod output;

use crate::anki::repository::{AnkiRepository, AnkiRepositoryError};
use notionrs_types::prelude::*;
use output::*;

#[derive(Debug, thiserror::Error)]
pub enum AnkiUseCaseError {
    #[error("datetime parse error: {0}")]
    DateTimeParse(#[from] time::error::Parse),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("repository error: {0}")]
    Repository(#[from] AnkiRepositoryError),
    #[error("internal error: {0}")]
    Internal(#[from] crate::error::Error),
}

pub struct AnkiUseCase {
    pub anki_repository: std::sync::Arc<dyn AnkiRepository + Send + Sync>,
}

// The renderer (`@elmethis/qwik`'s `ElmA2ui`) resolves the root via the
// hardcoded id "root", so each section's synthetic root Column must use
// that exact id rather than a UUID.
const SECTION_ROOT_ID: &str = "root";

fn build_section_surface(
    source: &n2a2ui_a2ui::v0_9::Surface,
    child_ids: Vec<String>,
) -> n2a2ui_a2ui::v0_9::Surface {
    let root_column = n2a2ui_a2ui::v0_9::Column {
        id: SECTION_ROOT_ID.to_string(),
        children: n2a2ui_a2ui::v0_9::ChildList::Static(child_ids),
        ..Default::default()
    };

    let mut components = source.components.clone();
    components.shift_remove(&source.root);
    components.insert(
        SECTION_ROOT_ID.to_string(),
        n2a2ui_a2ui::v0_9::Component::Column(root_column),
    );

    n2a2ui_a2ui::v0_9::Surface {
        root: SECTION_ROOT_ID.to_string(),
        components,
    }
}

impl AnkiUseCase {
    pub async fn get_anki_by_id(&self, id: &str) -> Result<AnkiEntity, AnkiUseCaseError> {
        let page = self.anki_repository.get_anki_by_id(id).await?;

        let anki = page.try_into()?;

        Ok(anki)
    }

    pub async fn list_anki(
        &self,
        page_size: u32,
        next_cursor: Option<String>,
    ) -> Result<(Vec<AnkiEntity>, Option<String>), AnkiUseCaseError> {
        let pages = self
            .anki_repository
            .list_anki(page_size, next_cursor)
            .await?;

        let anki_list = pages
            .results
            .into_iter()
            .map(|anki| anki.try_into())
            .collect::<Result<Vec<AnkiEntity>, crate::error::Error>>()?;

        let next_cursor = pages.next_cursor;

        Ok((anki_list, next_cursor))
    }

    pub async fn list_blocks(&self, id: &str) -> Result<AnkiBlockEntity, AnkiUseCaseError> {
        use n2a2ui_a2ui::v0_9::{ChildList, Component, DynamicString, HeadingLevel};

        let surface = self.anki_repository.list_blocks_by_id(id).await?;

        let root_children: Vec<String> = match surface.components.get(&surface.root) {
            Some(Component::Column(column)) => match &column.children {
                ChildList::Static(ids) => ids.clone(),
                ChildList::Template(_) => Vec::new(),
            },
            _ => Vec::new(),
        };

        enum Marker {
            Front,
            Back,
            Explanation,
        }

        let mut marker = Marker::Front;
        let mut front: Vec<String> = Vec::new();
        let mut back: Vec<String> = Vec::new();
        let mut explanation: Vec<String> = Vec::new();

        for child_id in root_children {
            if let Some(Component::Heading(heading)) = surface.components.get(&child_id) {
                if matches!(heading.level, HeadingLevel::H1) {
                    let heading_ids = match &heading.children {
                        ChildList::Static(ids) => ids.as_slice(),
                        ChildList::Template(_) => &[],
                    };

                    let text = heading_ids
                        .iter()
                        .filter_map(|id| match surface.components.get(id) {
                            Some(Component::RichText(rt)) => match &rt.text {
                                DynamicString::Literal(s) => Some(s.as_str()),
                                _ => None,
                            },
                            _ => None,
                        })
                        .collect::<String>()
                        .trim()
                        .to_lowercase();

                    match text.as_str() {
                        "front" => {
                            marker = Marker::Front;
                            continue;
                        }
                        "back" => {
                            marker = Marker::Back;
                            continue;
                        }
                        "explanation" => {
                            marker = Marker::Explanation;
                            continue;
                        }
                        _ => {}
                    }
                }
            }

            match marker {
                Marker::Front => front.push(child_id),
                Marker::Back => back.push(child_id),
                Marker::Explanation => explanation.push(child_id),
            }
        }

        let front_surface = build_section_surface(&surface, front);
        let back_surface = build_section_surface(&surface, back);
        let explanation_surface = build_section_surface(&surface, explanation);

        Ok(AnkiBlockEntity {
            front: serde_json::to_value(front_surface)?,
            back: serde_json::to_value(back_surface)?,
            explanation: serde_json::to_value(explanation_surface)?,
        })
    }

    pub async fn create_anki(&self, title: Option<String>) -> Result<AnkiEntity, AnkiUseCaseError> {
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

        let anki = page_response.try_into()?;

        Ok(anki)
    }

    pub async fn update_anki(
        &self,
        page_id: &str,
        ease_factor: Option<f64>,
        repetition_count: Option<u32>,
        next_review_at: Option<String>,
        is_review_required: Option<bool>,
        in_trash: Option<bool>,
    ) -> Result<AnkiEntity, AnkiUseCaseError> {
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

        if let Some(is_review_required) = is_review_required {
            properties.insert(
                "isReviewRequired".to_owned(),
                PageProperty::Checkbox(PageCheckboxProperty::from(is_review_required)),
            );
        };

        let page_response = self
            .anki_repository
            .update_anki(page_id, properties, in_trash)
            .await?;

        let anki = page_response.try_into()?;

        Ok(anki)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::anki::repository::AnkiRepositoryStub;

    #[tokio::test]
    async fn separate_blocks() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_use_case = AnkiUseCase {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_use_case
            .list_blocks("28b8e5f3-ba43-44a8-b790-bfc8c62b7628")
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn create_anki() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_use_case = AnkiUseCase {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_use_case
            .create_anki(Some("title".to_string()))
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn update_anki() {
        let anki_repository_stub = std::sync::Arc::new(AnkiRepositoryStub);
        let anki_use_case = AnkiUseCase {
            anki_repository: anki_repository_stub,
        };

        let _ = anki_use_case
            .update_anki(
                "28b8e5f3-ba43-44a8-b790-bfc8c62b7628",
                Some(2.5),
                Some(0),
                Some("2021-09-01T00:00:00+09:00".to_string()),
                None,
                None,
            )
            .await
            .unwrap();
    }
}
