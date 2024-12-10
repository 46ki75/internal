impl super::BookmarkMeta {
    pub async fn new(
        _: &async_graphql::Context<'_>,
        name: String,
        url: String,
    ) -> Result<crate::model::bookmark::BookmarkMeta, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")?;

        let database_id = std::env::var("NOTION_BOOKMARK_DATABASE_ID")?;

        let client = notionrs::client::Client::new().secret(&secret);

        let parsed_url = url::Url::parse(&url)?;
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
                notionrs::page::PageTitleProperty::from(&name),
            ),
        );

        properties.insert(
            "url".to_string(),
            notionrs::page::properties::PageProperty::Url(notionrs::page::PageUrlProperty::from(
                &url,
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

        Ok(crate::model::bookmark::BookmarkMeta {
            id,
            name: Some(name.to_string()),
            url: Some(url.to_string()),
            favicon: Some(favicon),
        })
    }
}
