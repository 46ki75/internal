#[derive(Default)]
pub struct BookmarkQuery;

#[async_graphql::Object]
impl BookmarkQuery {
    pub async fn list_bookmark(
        &self,
    ) -> Result<Vec<crate::model::bookmark::Bookmark>, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_BOOKMARK_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let request = client
            .query_database()
            .database_id(database_id)
            .page_size(100);

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

                Ok(crate::model::bookmark::Bookmark {
                    id,
                    name,
                    url,
                    favicon,
                })
            })
            .collect::<Result<Vec<crate::model::bookmark::Bookmark>, async_graphql::Error>>()?;

        Ok(bookmarks)
    }
}
