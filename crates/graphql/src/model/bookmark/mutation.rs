#[derive(Default)]
pub struct BookmarkMutation;

#[derive(async_graphql::InputObject)]
pub struct CreateBookmarkInput {
    pub name: String,
    pub url: String,
}

#[async_graphql::Object]
impl BookmarkMutation {
    pub async fn create_bookmark(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: CreateBookmarkInput,
    ) -> Result<crate::model::bookmark::Bookmark, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")?;

        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID")?;

        let client = notionrs::client::Client::new().secret(&secret);

        let parsed_url = url::Url::parse(&input.url)?;
        let fqdn = parsed_url.host_str().ok_or(async_graphql::Error::from(
            "URL does not contain a valid host.",
        ))?;

        let favicon = format!("https://logo.clearbit.com/{}", fqdn);

        let mut properties: std::collections::HashMap<
            String,
            notionrs::page::properties::PageProperty,
        > = std::collections::HashMap::new();

        properties.insert(
            "name".to_string(),
            notionrs::page::properties::PageProperty::Title(
                notionrs::page::PageTitleProperty::from(&input.name),
            ),
        );

        properties.insert(
            "url".to_string(),
            notionrs::page::properties::PageProperty::Url(notionrs::page::PageUrlProperty::from(
                &input.url,
            )),
        );

        let request = client
            .create_page()
            .database_id(database_id)
            .properties(properties)
            .icon(notionrs::others::icon::Icon::File(
                notionrs::File::External(notionrs::others::file::ExternalFile::from(&favicon)),
            ));

        let response = request.send().await?;

        let id = response.id;

        let tags_property = response.properties.get("tags").ok_or("tags not found")?;

        let tags = match tags_property {
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
                .collect::<Result<Vec<crate::model::bookmark::BookmarkTag>, async_graphql::Error>>(
                )?,
            _ => return Err(async_graphql::Error::from("tags not found")),
        };

        Ok(crate::model::bookmark::Bookmark {
            id,
            name: Some(input.name),
            url: Some(input.url),
            favicon: Some(favicon),
            tags,
            notion_url: response.url,
        })
    }
}
