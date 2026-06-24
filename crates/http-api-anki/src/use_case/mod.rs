pub mod input;
pub mod output;

use crate::repository::{AnkiRepository, AnkiRepositoryError};
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
    Internal(#[from] http_api_core::error::Error),
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

/// Walks a surface's root children and partitions their ids into the
/// `(front, back, explanation)` sections, switching buckets on H1 headings
/// whose text is exactly "front", "back", or "explanation" (case-insensitive,
/// trimmed). The marker headings themselves are dropped; every other block —
/// including non-H1 or unrecognized headings — is kept as content in the
/// current section. Blocks before the first marker default to `front`.
fn partition_blocks_by_section(
    surface: &n2a2ui_a2ui::v0_9::Surface,
) -> (Vec<String>, Vec<String>, Vec<String>) {
    use n2a2ui_a2ui::v0_9::{ChildList, Component, DynamicString, HeadingLevel};

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
        if let Some(Component::Heading(heading)) = surface.components.get(&child_id)
            && matches!(heading.level, HeadingLevel::H1)
        {
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

        match marker {
            Marker::Front => front.push(child_id),
            Marker::Back => back.push(child_id),
            Marker::Explanation => explanation.push(child_id),
        }
    }

    (front, back, explanation)
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
            .collect::<Result<Vec<AnkiEntity>, http_api_core::error::Error>>()?;

        let next_cursor = pages.next_cursor;

        Ok((anki_list, next_cursor))
    }

    pub async fn list_blocks(&self, id: &str) -> Result<AnkiBlockEntity, AnkiUseCaseError> {
        let surface = self.anki_repository.list_blocks_by_id(id).await?;

        let (front, back, explanation) = partition_blocks_by_section(&surface);

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
    use crate::repository::AnkiRepositoryStub;
    use n2a2ui_a2ui::v0_9::{
        ChildList, Column, Component, DynamicString, Heading, HeadingLevel, RichText, Surface,
    };

    // ---- test-surface builders ----

    /// An H1 heading whose visible text is `text`, plus the inner RichText that
    /// carries it. Returns both components; the heading id is `id`.
    fn marker(id: &str, text: &str) -> Vec<(String, Component)> {
        let txt_id = format!("{id}-txt");
        vec![
            (
                id.to_string(),
                Component::Heading(Heading {
                    id: id.to_string(),
                    level: HeadingLevel::H1,
                    children: ChildList::Static(vec![txt_id.clone()]),
                    ..Default::default()
                }),
            ),
            (
                txt_id.clone(),
                Component::RichText(RichText {
                    id: txt_id,
                    text: DynamicString::Literal(text.to_string()),
                    ..Default::default()
                }),
            ),
        ]
    }

    /// An H1 heading whose text is NOT a section marker (e.g. "notes").
    fn heading_with_level(id: &str, level: HeadingLevel, text: &str) -> Vec<(String, Component)> {
        let txt_id = format!("{id}-txt");
        vec![
            (
                id.to_string(),
                Component::Heading(Heading {
                    id: id.to_string(),
                    level,
                    children: ChildList::Static(vec![txt_id.clone()]),
                    ..Default::default()
                }),
            ),
            (
                txt_id.clone(),
                Component::RichText(RichText {
                    id: txt_id,
                    text: DynamicString::Literal(text.to_string()),
                    ..Default::default()
                }),
            ),
        ]
    }

    /// A plain content block (a RichText not nested under any heading).
    fn content(id: &str) -> (String, Component) {
        (
            id.to_string(),
            Component::RichText(RichText {
                id: id.to_string(),
                text: DynamicString::Literal(format!("content-{id}")),
                ..Default::default()
            }),
        )
    }

    fn build_surface(root_children: &[&str], comps: Vec<(String, Component)>) -> Surface {
        let mut components = indexmap::IndexMap::new();
        components.insert(
            "root".to_string(),
            Component::Column(Column {
                id: "root".to_string(),
                children: ChildList::Static(root_children.iter().map(|s| s.to_string()).collect()),
                ..Default::default()
            }),
        );
        for (id, c) in comps {
            components.insert(id, c);
        }
        Surface {
            root: "root".to_string(),
            components,
        }
    }

    // ---- partition_blocks_by_section (pure) ----

    #[test]
    fn partition_three_sections() {
        let mut comps = Vec::new();
        comps.extend(marker("hf", "front"));
        comps.push(content("c1"));
        comps.extend(marker("hb", "back"));
        comps.push(content("c2"));
        comps.extend(marker("he", "explanation"));
        comps.push(content("c3"));
        let surface = build_surface(&["hf", "c1", "hb", "c2", "he", "c3"], comps);

        let (front, back, explanation) = partition_blocks_by_section(&surface);

        assert_eq!(front, vec!["c1"]);
        assert_eq!(back, vec!["c2"]);
        assert_eq!(explanation, vec!["c3"]);
    }

    #[test]
    fn partition_marker_text_is_case_insensitive_and_trimmed() {
        let mut comps = Vec::new();
        comps.extend(marker("hf", "  Front  "));
        comps.push(content("c1"));
        comps.extend(marker("hb", "BACK"));
        comps.push(content("c2"));
        let surface = build_surface(&["hf", "c1", "hb", "c2"], comps);

        let (front, back, explanation) = partition_blocks_by_section(&surface);

        assert_eq!(front, vec!["c1"]);
        assert_eq!(back, vec!["c2"]);
        assert!(explanation.is_empty());
    }

    #[test]
    fn partition_blocks_before_first_marker_default_to_front() {
        let mut comps = Vec::new();
        comps.push(content("c0"));
        comps.extend(marker("hb", "back"));
        comps.push(content("c1"));
        let surface = build_surface(&["c0", "hb", "c1"], comps);

        let (front, back, explanation) = partition_blocks_by_section(&surface);

        assert_eq!(front, vec!["c0"]);
        assert_eq!(back, vec!["c1"]);
        assert!(explanation.is_empty());
    }

    #[test]
    fn partition_unknown_h1_heading_is_kept_as_content() {
        let mut comps = Vec::new();
        comps.extend(marker("hb", "back"));
        comps.extend(heading_with_level("hu", HeadingLevel::H1, "notes"));
        comps.push(content("c1"));
        let surface = build_surface(&["hb", "hu", "c1"], comps);

        let (front, back, explanation) = partition_blocks_by_section(&surface);

        // The unrecognized heading id itself stays in the current (back) section.
        assert_eq!(back, vec!["hu", "c1"]);
        assert!(front.is_empty());
        assert!(explanation.is_empty());
    }

    #[test]
    fn partition_non_h1_marker_does_not_switch() {
        // An H2 "front" must not switch the section — only H1 markers do.
        let mut comps = Vec::new();
        comps.extend(heading_with_level("h2", HeadingLevel::H2, "front"));
        comps.push(content("c1"));
        let surface = build_surface(&["h2", "c1"], comps);

        let (front, back, explanation) = partition_blocks_by_section(&surface);

        // Stays in the default front bucket and keeps the H2 heading as content.
        assert_eq!(front, vec!["h2", "c1"]);
        assert!(back.is_empty());
        assert!(explanation.is_empty());
    }

    #[test]
    fn partition_preserves_order_within_section() {
        let mut comps = Vec::new();
        comps.extend(marker("hb", "back"));
        comps.push(content("c1"));
        comps.push(content("c2"));
        let surface = build_surface(&["hb", "c1", "c2"], comps);

        let (_, back, _) = partition_blocks_by_section(&surface);

        assert_eq!(back, vec!["c1", "c2"]);
    }

    #[test]
    fn partition_empty_root_is_all_empty() {
        let surface = build_surface(&[], Vec::new());
        let (front, back, explanation) = partition_blocks_by_section(&surface);
        assert!(front.is_empty());
        assert!(back.is_empty());
        assert!(explanation.is_empty());
    }

    #[test]
    fn partition_root_not_a_column_is_all_empty() {
        let mut components = indexmap::IndexMap::new();
        components.insert("root".to_string(), content("root").1);
        let surface = Surface {
            root: "root".to_string(),
            components,
        };

        let (front, back, explanation) = partition_blocks_by_section(&surface);
        assert!(front.is_empty());
        assert!(back.is_empty());
        assert!(explanation.is_empty());
    }

    // ---- build_section_surface (pure) ----

    #[test]
    fn build_section_surface_rewrites_root_and_preserves_others() {
        let source = build_surface(&["a", "b"], vec![content("a"), content("b")]);
        // Give the source a non-"root" root id to prove the old root is removed.
        let source = Surface {
            root: "orig".to_string(),
            components: {
                let mut c = source.components;
                // rename the column under id "orig"
                let col = c.shift_remove("root").unwrap();
                c.insert("orig".to_string(), col);
                c
            },
        };

        let result = build_section_surface(&source, vec!["a".to_string()]);

        assert_eq!(result.root, SECTION_ROOT_ID);
        assert!(result.components.contains_key(SECTION_ROOT_ID));
        assert!(!result.components.contains_key("orig"));
        match result.components.get(SECTION_ROOT_ID) {
            Some(Component::Column(col)) => match &col.children {
                ChildList::Static(ids) => assert_eq!(ids, &vec!["a".to_string()]),
                _ => panic!("expected static children"),
            },
            _ => panic!("expected a Column at the root id"),
        }
        // Non-root content components survive.
        assert!(result.components.contains_key("a"));
        assert!(result.components.contains_key("b"));
    }

    #[test]
    fn build_section_surface_accepts_empty_children() {
        let source = build_surface(&["a"], vec![content("a")]);
        let result = build_section_surface(&source, Vec::new());

        match result.components.get(SECTION_ROOT_ID) {
            Some(Component::Column(col)) => match &col.children {
                ChildList::Static(ids) => assert!(ids.is_empty()),
                _ => panic!("expected static children"),
            },
            _ => panic!("expected a Column at the root id"),
        }
    }

    // ---- async use-case methods (via stub) ----

    #[tokio::test]
    async fn list_blocks_returns_three_root_surfaces() {
        let anki_use_case = AnkiUseCase {
            anki_repository: std::sync::Arc::new(AnkiRepositoryStub),
        };

        let blocks = anki_use_case
            .list_blocks("28b8e5f3-ba43-44a8-b790-bfc8c62b7628")
            .await
            .unwrap();

        for section in [&blocks.front, &blocks.back, &blocks.explanation] {
            assert_eq!(section["root"], "root");
        }
    }

    #[tokio::test]
    async fn create_anki_maps_stub_response() {
        let anki_use_case = AnkiUseCase {
            anki_repository: std::sync::Arc::new(AnkiRepositoryStub),
        };

        let anki = anki_use_case
            .create_anki(Some("title".to_string()))
            .await
            .unwrap();

        assert_eq!(anki.page_id, "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e");
        assert_eq!(anki.title.as_deref(), Some("title"));
        assert_eq!(anki.ease_factor, 2.5);
        assert_eq!(anki.repetition_count, 5);
        assert!(!anki.is_review_required);
    }

    #[tokio::test]
    async fn update_anki_maps_stub_response() {
        let anki_use_case = AnkiUseCase {
            anki_repository: std::sync::Arc::new(AnkiRepositoryStub),
        };

        let anki = anki_use_case
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

        assert_eq!(anki.ease_factor, 2.5);
        assert_eq!(anki.repetition_count, 5);
        assert_eq!(anki.title.as_deref(), Some("title"));
    }
}
