pub struct AnkiService;

impl AnkiService {
    pub fn try_convert(
        page_response: notionrs::page::PageResponse,
    ) -> Result<crate::model::anki::Anki, async_graphql::Error> {
        let properties = page_response.properties;

        // >>> title
        let title_property = properties
            .get("title")
            .ok_or(async_graphql::Error::from("title not found"))?;

        let title = match title_property {
            notionrs::page::PageProperty::Title(title) => {
                if title.to_string().trim().is_empty() {
                    None
                } else {
                    Some(title.to_string().trim().to_string())
                }
            }
            _ => return Err(async_graphql::Error::from("title not found")),
        };
        // <<< title

        // >>> description
        let description_property = properties
            .get("description")
            .ok_or(async_graphql::Error::from("description not found"))?;

        let description = match description_property {
            notionrs::page::PageProperty::RichText(description) => {
                if description.to_string().trim().is_empty() {
                    None
                } else {
                    Some(description.to_string().trim().to_string())
                }
            }
            _ => return Err(async_graphql::Error::from("description not found")),
        };
        // <<< description

        // >>> ease_factor
        let ease_factor_property = properties
            .get("easeFactor")
            .ok_or(async_graphql::Error::from("easeFactor not found"))?;

        let ease_factor = match ease_factor_property {
            notionrs::page::PageProperty::Number(ease_factor) => ease_factor
                .number
                .ok_or(async_graphql::Error::from("easeFactor not found"))?,
            _ => return Err(async_graphql::Error::from("easeFactor not found")),
        };
        // <<< ease_factor

        // >>> repetition_count
        let repetition_count_property = properties
            .get("repetitionCount")
            .ok_or(async_graphql::Error::from("repetitionCount not found"))?;

        let repetition_count = match repetition_count_property {
            notionrs::page::PageProperty::Number(repetition_count) => repetition_count
                .number
                .ok_or(async_graphql::Error::from("repetitionCount not found"))?
                as u32,
            _ => return Err(async_graphql::Error::from("repetitionCount not found")),
        };
        // <<< repetition_count

        // >>> next_review_at
        let next_review_at_property = &properties
            .get("nextReviewAt")
            .ok_or(async_graphql::Error::from("nextReviewAt not found"))?;

        let next_review_at = match next_review_at_property {
            notionrs::page::PageProperty::Date(next_review_at) => next_review_at
                .clone()
                .date
                .ok_or(async_graphql::Error::from("nextReviewAt not found"))?
                .start
                .ok_or(async_graphql::Error::from("nextReviewAt not found"))?
                .to_rfc3339(),
            _ => return Err(async_graphql::Error::from("nextReviewAt not found")),
        };
        // <<< next_review_at

        // >>> tags
        let tags_property = &properties.get("tags").ok_or("tags not found")?;

        let tags = match tags_property {
            notionrs::page::PageProperty::MultiSelect(tags) => tags
                .multi_select
                .iter()
                .map(|tag| {
                    Ok(crate::model::anki::AnkiTag {
                        id: tag
                            .clone()
                            .id
                            .ok_or(async_graphql::Error::from("tag id not found"))?,
                        name: tag.name.to_string(),
                        color: match tag
                            .color
                            .ok_or(async_graphql::Error::from("tag color not found"))?
                        {
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
                .collect::<Result<Vec<crate::model::anki::AnkiTag>, async_graphql::Error>>(),
            _ => return Err(async_graphql::Error::from("tags not found")),
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::anki::{AnkiRepository, AnkiRepositoryStab};

    #[tokio::test]
    async fn try_convert() {
        let anki_repository = AnkiRepositoryStab;

        let page = anki_repository
            .get_anki_by_id("7752cfaa-73d9-4102-9177-f5e65cb51493")
            .await
            .unwrap();

        let _ = AnkiService::try_convert(page).unwrap();
    }
}
