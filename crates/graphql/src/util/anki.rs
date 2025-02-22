pub struct AnkiUtil;

impl AnkiUtil {
    pub fn convert_page_response(
        page_response: notionrs::page::PageResponse,
    ) -> Result<crate::model::anki::Anki, crate::error::Error> {
        let properties = page_response.properties;

        // >>> title
        let title_property =
            properties
                .get("title")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "title".to_string(),
                ))?;

        let title = match title_property {
            notionrs::page::PageProperty::Title(title) => {
                if title.to_string().trim().is_empty() {
                    None
                } else {
                    Some(title.to_string().trim().to_string())
                }
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "title".to_string(),
                ))
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
            notionrs::page::PageProperty::RichText(description) => {
                if description.to_string().trim().is_empty() {
                    None
                } else {
                    Some(description.to_string().trim().to_string())
                }
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "description".to_string(),
                ))
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
            notionrs::page::PageProperty::Number(ease_factor) => {
                ease_factor
                    .number
                    .ok_or(crate::error::Error::NotionPropertynotFound(
                        "easeFactor".to_string(),
                    ))?
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "easeFactor".to_string(),
                ))
            }
        };
        // <<< ease_factor

        // >>> repetition_count
        let repetition_count_property = properties.get("repetitionCount").ok_or(
            crate::error::Error::NotionPropertynotFound("repetitionCount".to_string()),
        )?;

        let repetition_count = match repetition_count_property {
            notionrs::page::PageProperty::Number(repetition_count) => repetition_count
                .number
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "repetitionCount".to_string(),
                ))? as u32,
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "repetitionCount".to_string(),
                ))
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
            notionrs::page::PageProperty::Date(next_review_at) => next_review_at
                .clone()
                .date
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ))?
                .start
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ))?
                .to_rfc3339(),
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "nextReviewAt".to_string(),
                ))
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
            notionrs::page::PageProperty::MultiSelect(tags) => {
                tags.multi_select
                    .iter()
                    .map(|tag| {
                        Ok(crate::model::anki::AnkiTag {
                            id: tag.clone().id.ok_or(
                                crate::error::Error::NotionPropertynotFound("tag.id".to_string()),
                            )?,
                            name: tag.name.to_string(),
                            color: match tag.color.ok_or(
                                crate::error::Error::NotionPropertynotFound(
                                    "tag.color".to_string(),
                                ),
                            )? {
                                notionrs::others::select::SelectColor::Default => "#868e9c",
                                notionrs::others::select::SelectColor::Blue => "#6987b8",
                                notionrs::others::select::SelectColor::Brown => "#a17c5b",
                                notionrs::others::select::SelectColor::Gray => "#59b57c",
                                notionrs::others::select::SelectColor::Green => "#59b57c",
                                notionrs::others::select::SelectColor::Orange => "#d48b70",
                                notionrs::others::select::SelectColor::Pink => "#c9699e",
                                notionrs::others::select::SelectColor::Purple => "#9771bd",
                                notionrs::others::select::SelectColor::Red => "#c56565",
                                notionrs::others::select::SelectColor::Yellow => "#cdb57b",
                            }
                            .to_string(),
                        })
                    })
                    .collect::<Result<Vec<crate::model::anki::AnkiTag>, crate::error::Error>>()
            }
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "tags".to_string(),
                ))
            }
        }?;
        // <<< tags

        let page_id = page_response.id.to_string();
        let created_at = page_response.created_time.to_rfc3339();
        let updated_at = page_response.last_edited_time.to_rfc3339();
        let url = page_response.url.to_string();

        Ok(crate::model::anki::Anki {
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
        })
    }
}
