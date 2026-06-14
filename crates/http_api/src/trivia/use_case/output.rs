pub struct TriviaEntity {
    pub page_id: String,
    pub title: Option<String>,
    pub view_count: u32,
    pub created_at: String,
    pub updated_at: String,
    pub url: String,
}

pub struct TriviaBlockEntity {
    pub surface: serde_json::Value,
}

impl TryFrom<notionrs_types::object::page::PageResponse> for TriviaEntity {
    type Error = crate::error::Error;

    fn try_from(
        page_response: notionrs_types::object::page::PageResponse,
    ) -> Result<Self, Self::Error> {
        use notionrs_types::object::page::PageProperty;

        let properties = &page_response.properties;

        // The title property name is not fixed across databases, so resolve it
        // by type rather than by key.
        let title = properties.values().find_map(|property| match property {
            PageProperty::Title(title) => {
                let value = title.to_string().trim().to_string();
                if value.is_empty() { None } else { Some(value) }
            }
            _ => None,
        });

        // `view_count` defaults to 0 when the property is missing or unset.
        let view_count = properties
            .get("view_count")
            .and_then(|property| match property {
                PageProperty::Number(number) => number.number,
                _ => None,
            })
            .unwrap_or(0.0) as u32;

        Ok(TriviaEntity {
            page_id: page_response.id.to_string(),
            title,
            view_count,
            created_at: page_response.created_time.to_string(),
            updated_at: page_response.last_edited_time.to_string(),
            url: page_response.url.to_string(),
        })
    }
}
