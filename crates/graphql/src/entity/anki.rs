pub struct AnkiEntity {
    pub page_id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub ease_factor: f64,
    pub repetition_count: u32,
    pub next_review_at: String,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<AnkiTagEntity>,
    pub url: String,
    pub is_review_required: bool,
}

pub struct AnkiTagEntity {
    pub id: String,
    pub name: String,
    pub color: String,
}

pub struct AnkiBlockEntity {
    pub front: serde_json::Value,
    pub back: serde_json::Value,
    pub explanation: serde_json::Value,
}

impl TryFrom<notionrs_types::object::page::PageResponse> for AnkiEntity {
    type Error = crate::error::Error;

    fn try_from(
        page_response: notionrs_types::object::page::PageResponse,
    ) -> Result<Self, Self::Error> {
        let properties = page_response.properties;

        // >>> title
        let title_property =
            properties
                .get("title")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "title".to_string(),
                ))?;

        let title = match title_property {
            notionrs_types::object::page::PageProperty::Title(title) => {
                if title.to_string().trim().is_empty() {
                    None
                } else {
                    Some(title.to_string().trim().to_string())
                }
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "title".to_string(),
                ));
            }
        };
        // <<< title

        // >>> description
        let description_property =
            properties
                .get("description")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "description".to_string(),
                ))?;

        let description = match description_property {
            notionrs_types::object::page::PageProperty::RichText(description) => {
                if description.to_string().trim().is_empty() {
                    None
                } else {
                    Some(description.to_string().trim().to_string())
                }
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "description".to_string(),
                ));
            }
        };
        // <<< description

        // >>> ease_factor
        let ease_factor_property =
            properties
                .get("easeFactor")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "easeFactor".to_string(),
                ))?;

        let ease_factor = match ease_factor_property {
            notionrs_types::object::page::PageProperty::Number(ease_factor) => ease_factor
                .number
                .ok_or(
                crate::error::Error::NotionPropertynotFound("easeFactor".to_string()),
            )?,
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "easeFactor".to_string(),
                ));
            }
        };
        // <<< ease_factor

        // >>> repetition_count
        let repetition_count_property = properties.get("repetitionCount").ok_or(
            crate::error::Error::NotionPropertynotFound("repetitionCount".to_string()),
        )?;

        let repetition_count = match repetition_count_property {
            notionrs_types::object::page::PageProperty::Number(repetition_count) => {
                repetition_count
                    .number
                    .ok_or(crate::error::Error::NotionPropertynotFound(
                        "repetitionCount".to_string(),
                    ))? as u32
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "repetitionCount".to_string(),
                ));
            }
        };
        // <<< repetition_count

        // >>> next_review_at
        let next_review_at_property =
            &properties
                .get("nextReviewAt")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ))?;

        let next_review_at = match next_review_at_property {
            notionrs_types::object::page::PageProperty::Date(next_review_at) => next_review_at
                .clone()
                .date
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ))?
                .start
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ))?
                .to_string(),
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ));
            }
        };
        // <<< next_review_at

        // >>> tags
        let tags_property =
            &properties
                .get("tags")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "tags".to_string(),
                ))?;

        let tags = match tags_property {
            notionrs_types::object::page::PageProperty::MultiSelect(tags) => tags
                .multi_select
                .iter()
                .map(|tag| {
                    Ok(crate::entity::anki::AnkiTagEntity {
                        id: tag
                            .clone()
                            .id
                            .ok_or(crate::error::Error::NotionPropertynotFound(
                                "tag.id".to_string(),
                            ))?,
                        name: tag.name.to_string(),
                        color: match tag.color.ok_or(
                            crate::error::Error::NotionPropertynotFound("tag.color".to_string()),
                        )? {
                            notionrs_types::object::select::SelectColor::Default => "#868e9c",
                            notionrs_types::object::select::SelectColor::Blue => "#6987b8",
                            notionrs_types::object::select::SelectColor::Brown => "#a17c5b",
                            notionrs_types::object::select::SelectColor::Gray => "#59b57c",
                            notionrs_types::object::select::SelectColor::Green => "#59b57c",
                            notionrs_types::object::select::SelectColor::Orange => "#d48b70",
                            notionrs_types::object::select::SelectColor::Pink => "#c9699e",
                            notionrs_types::object::select::SelectColor::Purple => "#9771bd",
                            notionrs_types::object::select::SelectColor::Red => "#c56565",
                            notionrs_types::object::select::SelectColor::Yellow => "#cdb57b",
                        }
                        .to_string(),
                    })
                })
                .collect::<Result<Vec<crate::entity::anki::AnkiTagEntity>, crate::error::Error>>(),
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "tags".to_string(),
                ));
            }
        }?;
        // <<< tags

        let review_required = &properties.get("isReviewRequired").ok_or(
            crate::error::Error::NotionPropertynotFound("isReviewRequired".to_string()),
        )?;

        let is_review_required = match review_required {
            notionrs_types::prelude::PageProperty::Checkbox(page_checkbox_property) => {
                page_checkbox_property.checkbox
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "tags".to_string(),
                ));
            }
        };

        let page_id = page_response.id.to_string();
        let created_at = page_response.created_time.to_string();
        let updated_at = page_response.last_edited_time.to_string();
        let url = page_response.url.to_string();

        Ok(crate::entity::anki::AnkiEntity {
            page_id,
            title,
            description,
            ease_factor,
            repetition_count,
            next_review_at,
            created_at,
            updated_at,
            tags,
            url,
            is_review_required,
        })
    }
}
