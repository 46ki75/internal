#[derive(Default)]
pub struct BookmarkQuery;

#[derive(async_graphql::InputObject)]
pub struct BookmarkListInput {
    pub page_size: Option<u32>,
    pub next_cursor: Option<String>,
}

#[async_graphql::Object]
impl BookmarkQuery {
    pub async fn list_bookmark(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: Option<BookmarkListInput>,
    ) -> Result<crate::model::bookmark::BookmarkConnection, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_BOOKMARK_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let (page_size, next_cursor) = match input {
            Some(input) => (input.page_size.unwrap_or(100), input.next_cursor),
            None => (100, None),
        };

        let mut request = client
            .query_database()
            .database_id(database_id)
            .page_size(page_size);

        if let Some(next_cursor) = next_cursor {
            request = request.start_cursor(next_cursor);
        }

        let response = request.send().await?;

        let bookmarks = response
            .results
            .iter()
            .map(|bookmark| {
                let id = bookmark.id.to_string();

                let name_property = bookmark
                    .properties
                    .get("name")
                    .ok_or("name not found")
                    .map_err(async_graphql::Error::from)?;

                let name = match name_property {
                    notionrs::page::PageProperty::Title(title) => {
                        if title.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(title.to_string().trim().to_string())
                        }
                    }
                    _ => return Err(async_graphql::Error::from("name not found")),
                };

                let url_property = bookmark
                    .properties
                    .get("url")
                    .ok_or("url not found")
                    .map_err(async_graphql::Error::from)?;

                let url = match url_property {
                    notionrs::page::PageProperty::Url(url) => {
                        if url.to_string().trim().is_empty() {
                            None
                        } else {
                            Some(url.to_string().trim().to_string())
                        }
                    }
                    _ => return Err(async_graphql::Error::from("url not found")),
                };

                let favicon = bookmark.icon.clone().and_then(|i| match i {
                    notionrs::Icon::File(file) => Some(file.get_url()),
                    notionrs::Icon::Emoji(_) => None,
                });

                let tags_property = bookmark.properties.get("tags").ok_or("tags not found")?;

                let tags =
                    match tags_property {
                        notionrs::page::PageProperty::MultiSelect(selects) => selects
                            .multi_select
                            .iter()
                            .map(|select| {
                                let id = select.clone().id.ok_or("id not found")?;
                                let name = select.name.to_string();
                                let color = select.color;

                                Ok(crate::model::bookmark::BookmarkTag {
                                    id,
                                    name,
                                    color: match color.ok_or("color not found")? {
                                        notionrs::others::select::SelectColor::Default => {
                                            crate::model::bookmark::BookmarkTagColor::Default
                                        }
                                        notionrs::others::select::SelectColor::Blue => {
                                            crate::model::bookmark::BookmarkTagColor::Blue
                                        }
                                        notionrs::others::select::SelectColor::Brown => {
                                            crate::model::bookmark::BookmarkTagColor::Brown
                                        }
                                        notionrs::others::select::SelectColor::Gray => {
                                            crate::model::bookmark::BookmarkTagColor::Gray
                                        }
                                        notionrs::others::select::SelectColor::Green => {
                                            crate::model::bookmark::BookmarkTagColor::Green
                                        }
                                        notionrs::others::select::SelectColor::Orange => {
                                            crate::model::bookmark::BookmarkTagColor::Orange
                                        }
                                        notionrs::others::select::SelectColor::Pink => {
                                            crate::model::bookmark::BookmarkTagColor::Pink
                                        }
                                        notionrs::others::select::SelectColor::Purple => {
                                            crate::model::bookmark::BookmarkTagColor::Purple
                                        }
                                        notionrs::others::select::SelectColor::Red => {
                                            crate::model::bookmark::BookmarkTagColor::Red
                                        }
                                        notionrs::others::select::SelectColor::Yellow => {
                                            crate::model::bookmark::BookmarkTagColor::Yellow
                                        }
                                    },
                                })
                            })
                            .collect::<Result<
                                Vec<crate::model::bookmark::BookmarkTag>,
                                async_graphql::Error,
                            >>()?,
                        _ => return Err(async_graphql::Error::from("tags not found")),
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
            .collect::<Result<Vec<crate::model::bookmark::BookmarkEdge>, async_graphql::Error>>()?;

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
