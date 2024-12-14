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
