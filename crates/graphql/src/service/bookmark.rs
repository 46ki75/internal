use notionrs_types::prelude::*;

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
            .map(|bookmark| crate::entity::bookmark::Bookmark::try_from(bookmark.to_owned()))
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

        let bookmark = crate::entity::bookmark::Bookmark::try_from(response)?;

        Ok(bookmark)
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
