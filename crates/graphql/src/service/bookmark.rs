use notionrs::prelude::*;

pub struct BookmarkService {
    pub bookmark_repository:
        std::sync::Arc<dyn crate::repository::bookmark::BookmarkRepository + Send + Sync>,
}

impl BookmarkService {
    pub async fn list_bookmark(
        &self,
    ) -> Result<Vec<crate::entity::bookmark::Bookmark>, crate::error::Error> {
        let response = self.bookmark_repository.list_bookmark().await?;

        let bookmarks = response
            .iter()
            .map(|bookmark| {
                let id = bookmark.id.to_string();

                let name_property = bookmark.properties.get("name").ok_or(
                    crate::error::Error::NotionPropertynotFound("name".to_string()),
                )?;

                let name = match name_property {
                    PageProperty::Title(title) => {
                        if title.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(title.to_string().trim().to_string())
                        }
                    }
                    _ => {
                        return Err(crate::error::Error::NotionPropertynotFound(
                            "name".to_string(),
                        ));
                    }
                };

                let url_property = bookmark.properties.get("url").ok_or(
                    crate::error::Error::NotionPropertynotFound("url".to_string()),
                )?;

                let url = match url_property {
                    PageProperty::Url(url) => {
                        if url.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(url.to_string().trim().to_string())
                        }
                    }
                    _ => {
                        return Err(crate::error::Error::NotionPropertynotFound(
                            "url".to_string(),
                        ));
                    }
                };

                let favicon = bookmark.icon.clone().and_then(|i| match i {
                    notionrs::object::icon::Icon::File(file) => Some(file.get_url()),
                    _ => None,
                });

                let tags_property = bookmark.properties.get("tags").ok_or(
                    crate::error::Error::NotionPropertynotFound("tags".to_string()),
                )?;

                let tags =
                    match tags_property {
                        PageProperty::MultiSelect(selects) => selects
                            .multi_select
                            .iter()
                            .map(|select| {
                                let id = select.clone().id.ok_or(
                                    crate::error::Error::NotionPropertynotFound("id".to_string()),
                                )?;
                                let name = select.name.to_string();
                                let color = select.color;

                                Ok(crate::entity::bookmark::BookmarkTag {
                                    id,
                                    name,
                                    color: match color.ok_or(
                                        crate::error::Error::NotionPropertynotFound(
                                            "color".to_string(),
                                        ),
                                    )? {
                                        notionrs::object::select::SelectColor::Default => "#868e9c",
                                        notionrs::object::select::SelectColor::Blue => "#6987b8",
                                        notionrs::object::select::SelectColor::Brown => "#a17c5b",
                                        notionrs::object::select::SelectColor::Gray => "#59b57c",
                                        notionrs::object::select::SelectColor::Green => "#59b57c",
                                        notionrs::object::select::SelectColor::Orange => "#d48b70",
                                        notionrs::object::select::SelectColor::Pink => "#c9699e",
                                        notionrs::object::select::SelectColor::Purple => "#9771bd",
                                        notionrs::object::select::SelectColor::Red => "#c56565",
                                        notionrs::object::select::SelectColor::Yellow => "#cdb57b",
                                    }
                                    .to_string(),
                                })
                            })
                            .collect::<Result<
                                Vec<crate::entity::bookmark::BookmarkTag>,
                                crate::error::Error,
                            >>()?,
                        _ => {
                            return Err(crate::error::Error::NotionPropertynotFound(
                                "tags".to_string(),
                            ));
                        }
                    };

                Ok(crate::entity::bookmark::Bookmark {
                    id: id.to_string(),
                    name,
                    url,
                    favicon,
                    tags,
                    notion_url: bookmark.url.to_string(),
                })
            })
            .collect::<Result<Vec<crate::entity::bookmark::Bookmark>, crate::error::Error>>()?;

        Ok(bookmarks)
    }

    pub async fn create_bookmark(
        &self,
        name: &str,
        url: &str,
    ) -> Result<crate::entity::bookmark::Bookmark, crate::error::Error> {
        let parsed_url = url::Url::parse(url)?;
        let fqdn = parsed_url
            .host_str()
            .ok_or(crate::error::Error::FqdnParse(url.to_string()))?;

        let favicon = format!("https://logo.clearbit.com/{}", fqdn);

        let mut properties: std::collections::HashMap<String, PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "name".to_string(),
            PageProperty::Title(PageTitleProperty::from(name)),
        );

        properties.insert(
            "url".to_string(),
            PageProperty::Url(PageUrlProperty::from(url)),
        );

        let response = self
            .bookmark_repository
            .create_bookmark(properties, &favicon)
            .await?;

        let id = response.id;

        let tags_property =
            response
                .properties
                .get("tags")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "color".to_string(),
                ))?;

        let tags = match tags_property {
            PageProperty::MultiSelect(selects) => selects
                .multi_select
                .iter()
                .map(|select| {
                    let id =
                        select
                            .clone()
                            .id
                            .ok_or(crate::error::Error::NotionPropertynotFound(
                                "id".to_string(),
                            ))?;
                    let name = select.name.to_string();
                    let color = select.color;

                    Ok(crate::entity::bookmark::BookmarkTag {
                        id,
                        name,
                        color: match color.ok_or(crate::error::Error::NotionPropertynotFound(
                            "color".to_string(),
                        ))? {
                            notionrs::object::select::SelectColor::Default => "#868e9c",
                            notionrs::object::select::SelectColor::Blue => "#6987b8",
                            notionrs::object::select::SelectColor::Brown => "#a17c5b",
                            notionrs::object::select::SelectColor::Gray => "#59b57c",
                            notionrs::object::select::SelectColor::Green => "#59b57c",
                            notionrs::object::select::SelectColor::Orange => "#d48b70",
                            notionrs::object::select::SelectColor::Pink => "#c9699e",
                            notionrs::object::select::SelectColor::Purple => "#9771bd",
                            notionrs::object::select::SelectColor::Red => "#c56565",
                            notionrs::object::select::SelectColor::Yellow => "#cdb57b",
                        }
                        .to_string(),
                    })
                })
                .collect::<Result<Vec<crate::entity::bookmark::BookmarkTag>, crate::error::Error>>(
                )?,
            _ => {
                return Err(crate::error::Error::NotionPropertynotFound(
                    "tags".to_string(),
                ));
            }
        };

        Ok(crate::entity::bookmark::Bookmark {
            id,
            name: Some(name.to_string()),
            url: Some(url.to_string()),
            favicon: Some(favicon),
            tags,
            notion_url: response.url,
        })
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[tokio::test]
    async fn list_bookmark() {
        let bookmark_repository =
            std::sync::Arc::new(crate::repository::bookmark::BookmarkRepositoryStub);

        let bookmark_service = BookmarkService {
            bookmark_repository,
        };

        let _bookmark = bookmark_service
            .bookmark_repository
            .list_bookmark()
            .await
            .expect("list_bookmark failed");
    }

    #[tokio::test]
    async fn create_bookmark() {
        let bookmark_repository =
            std::sync::Arc::new(crate::repository::bookmark::BookmarkRepositoryStub);

        let bookmark_service = BookmarkService {
            bookmark_repository,
        };

        let _bookmark = bookmark_service
            .create_bookmark("name", "https://example.com")
            .await
            .expect("create_bookmark failed");
    }
}
