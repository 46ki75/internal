use notionrs_types::prelude::*;

pub struct BookmarkService {
    pub bookmark_repository:
        std::sync::Arc<dyn crate::repository::bookmark::BookmarkRepository + Send + Sync>,
}

impl BookmarkService {
    pub async fn list_bookmark(
        &self,
    ) -> Result<Vec<crate::entity::bookmark::BookmarkEntity>, crate::error::Error> {
        let response = self.bookmark_repository.list_bookmark().await?;

        let bookmarks = response
            .iter()
            .map(|bookmark| crate::entity::bookmark::BookmarkEntity::try_from(bookmark.to_owned()))
            .collect::<Result<Vec<crate::entity::bookmark::BookmarkEntity>, crate::error::Error>>(
            )?;

        Ok(bookmarks)
    }

    pub async fn create_bookmark(
        &self,
        name: &str,
        url: &str,
    ) -> Result<crate::entity::bookmark::BookmarkEntity, crate::error::Error> {
        let favicon = self.fetch_facicon_url(url).await;

        let mut properties: std::collections::HashMap<String, PageProperty> =
            std::collections::HashMap::new();

        properties.insert(
            "Name".to_string(),
            PageProperty::Title(PageTitleProperty::from(name)),
        );

        properties.insert(
            "URL".to_string(),
            PageProperty::Url(PageUrlProperty::from(url)),
        );

        let response = self
            .bookmark_repository
            .create_bookmark(properties, favicon)
            .await?;

        let bookmark = crate::entity::bookmark::BookmarkEntity::try_from(response)?;

        Ok(bookmark)
    }

    async fn fetch_facicon_url(&self, url: &str) -> Option<String> {
        let html = self.bookmark_repository.fetch_html(url).await.ok()?;

        let scraper = html_meta_scraper::MetaScraper::new(&html);

        let favicon = format!("/{}", scraper.favicon()?).replace("//", "/");

        let url = url::Url::parse(url).ok()?;

        let favicon_url = format!("{}://{}{}", url.scheme(), url.host()?, favicon);

        Some(favicon_url)
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
