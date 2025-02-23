pub struct BookmarkService {
    pub bookmark_repository:
        std::sync::Arc<dyn crate::repository::bookmark::BookmarkRepository + Send + Sync>,
}

impl BookmarkService {
    pub async fn list_bookmark(
        &self,
    ) -> Result<crate::model::bookmark::BookmarkConnection, crate::error::Error> {
        let response = self.bookmark_repository.list_bookmark().await?;

        let bookmarks = response
            .results
            .iter()
            .map(|bookmark| {
                let id = bookmark.id.to_string();

                let name_property = bookmark.properties.get("name").ok_or(
                    crate::error::Error::NotionPropertynotFound("name".to_string()),
                )?;

                let name = match name_property {
                    notionrs::page::PageProperty::Title(title) => {
                        if title.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(title.to_string().trim().to_string())
                        }
                    }
                    _ => {
                        return Err(crate::error::Error::NotionPropertynotFound(
                            "name".to_string(),
                        ))
                    }
                };

                let url_property = bookmark.properties.get("url").ok_or(
                    crate::error::Error::NotionPropertynotFound("url".to_string()),
                )?;

                let url = match url_property {
                    notionrs::page::PageProperty::Url(url) => {
                        if url.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(url.to_string().trim().to_string())
                        }
                    }
                    _ => {
                        return Err(crate::error::Error::NotionPropertynotFound(
                            "url".to_string(),
                        ))
                    }
                };

                let favicon = bookmark.icon.clone().and_then(|i| match i {
                    notionrs::Icon::File(file) => Some(file.get_url()),
                    _ => None,
                });

                let tags_property = bookmark.properties.get("tags").ok_or(
                    crate::error::Error::NotionPropertynotFound("tags".to_string()),
                )?;

                let tags =
                    match tags_property {
                        notionrs::page::PageProperty::MultiSelect(selects) => {
                            selects
                                .multi_select
                                .iter()
                                .map(|select| {
                                    let id = select.clone().id.ok_or(
                                        crate::error::Error::NotionPropertynotFound(
                                            "id".to_string(),
                                        ),
                                    )?;
                                    let name = select.name.to_string();
                                    let color = select.color;

                                    Ok(crate::model::bookmark::BookmarkTag {
                                        id,
                                        name,
                                        color: match color.ok_or(
                                            crate::error::Error::NotionPropertynotFound(
                                                "color".to_string(),
                                            ),
                                        )? {
                                            notionrs::others::select::SelectColor::Default => {
                                                "#868e9c"
                                            }
                                            notionrs::others::select::SelectColor::Blue => {
                                                "#6987b8"
                                            }
                                            notionrs::others::select::SelectColor::Brown => {
                                                "#a17c5b"
                                            }
                                            notionrs::others::select::SelectColor::Gray => {
                                                "#59b57c"
                                            }
                                            notionrs::others::select::SelectColor::Green => {
                                                "#59b57c"
                                            }
                                            notionrs::others::select::SelectColor::Orange => {
                                                "#d48b70"
                                            }
                                            notionrs::others::select::SelectColor::Pink => {
                                                "#c9699e"
                                            }
                                            notionrs::others::select::SelectColor::Purple => {
                                                "#9771bd"
                                            }
                                            notionrs::others::select::SelectColor::Red => "#c56565",
                                            notionrs::others::select::SelectColor::Yellow => {
                                                "#cdb57b"
                                            }
                                        }
                                        .to_string(),
                                    })
                                })
                                .collect::<Result<
                                    Vec<crate::model::bookmark::BookmarkTag>,
                                    crate::error::Error,
                                >>()?
                        }
                        _ => {
                            return Err(crate::error::Error::NotionPropertynotFound(
                                "tags".to_string(),
                            ))
                        }
                    };

                Ok(crate::model::bookmark::BookmarkEdge {
                    node: crate::model::bookmark::Bookmark {
                        id: id.to_string(),
                        name,
                        url,
                        favicon,
                        tags,
                        notion_url: bookmark.url.to_string(),
                    },
                    cursor: id,
                })
            })
            .collect::<Result<Vec<crate::model::bookmark::BookmarkEdge>, crate::error::Error>>()?;

        Ok(crate::model::bookmark::BookmarkConnection {
            edges: bookmarks,
            page_info: crate::model::PageInfo {
                has_next_page: response.has_more.unwrap_or(false),
                has_previous_page: false,
                start_cursor: None,
                end_cursor: None,
                next_cursor: response.next_cursor.clone(),
            },
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
}
