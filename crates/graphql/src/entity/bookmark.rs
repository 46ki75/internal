use notionrs_types::prelude::*;

pub struct BookmarkEntity {
    pub id: String,
    pub name: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
    pub tag: Option<BookmarkTagEntity>,
    pub nsfw: bool,
    pub notion_url: String,
}

impl TryFrom<PageResponse> for BookmarkEntity {
    type Error = crate::error::Error;
    fn try_from(value: PageResponse) -> Result<Self, Self::Error> {
        let id = value.id;

        let properties = value.properties;

        let name = properties
            .get("Name")
            .ok_or(crate::error::Error::NotionPropertynotFound(String::from(
                "Name",
            )))?;

        let url = properties
            .get("URL")
            .ok_or(crate::error::Error::NotionPropertynotFound(String::from(
                "URL",
            )))?;

        let tag = properties
            .get("Tag")
            .ok_or(crate::error::Error::NotionPropertynotFound(String::from(
                "Tag",
            )))?;

        let nsfw = properties
            .get("NSFW")
            .ok_or(crate::error::Error::NotionPropertynotFound(String::from(
                "NSFW",
            )))?;

        let select = if let PageProperty::Select(select) = tag {
            select.clone().select.and_then(|select| {
                Some(BookmarkTagEntity {
                    id: select
                        .id
                        .ok_or_else(|| {
                            let error = crate::error::Error::NotionPropertynotFound(String::from(
                                "select.id",
                            ));
                            tracing::error!("{}", error);
                            error
                        })
                        .ok()?,
                    name: select.name,
                    color: select
                        .color
                        .map(|color| {
                            match color {
                                SelectColor::Default => "#868e9c",
                                SelectColor::Blue => "#6987b8",
                                SelectColor::Brown => "#a17c5b",
                                SelectColor::Gray => "#59b57c",
                                SelectColor::Green => "#59b57c",
                                SelectColor::Orange => "#d48b70",
                                SelectColor::Pink => "#c9699e",
                                SelectColor::Purple => "#9771bd",
                                SelectColor::Red => "#c56565",
                                SelectColor::Yellow => "#cdb57b",
                            }
                            .to_string()
                        })
                        .ok_or_else(|| {
                            let error = crate::error::Error::NotionPropertynotFound(String::from(
                                "select.color",
                            ));
                            tracing::error!("{}", error);
                            error
                        })
                        .ok()?,
                })
            })
        } else {
            None
        };

        Ok(BookmarkEntity {
            id,
            name: Some(name.to_string()),
            url: Some(url.to_string()),
            favicon: value.icon.map(|f| f.to_string()),
            tag: select,
            nsfw: match nsfw {
                PageProperty::Checkbox(page_checkbox_property) => page_checkbox_property.checkbox,
                _ => true,
            },
            notion_url: value.url,
        })
    }
}

pub struct BookmarkTagEntity {
    pub id: String,
    pub name: String,
    pub color: String,
}
