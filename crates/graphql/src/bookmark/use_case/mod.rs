pub mod input;
pub mod output;

use crate::bookmark::repository::{BookmarkRepository, BookmarkRepositoryError};
use notionrs_types::prelude::*;
use output::*;

#[derive(Debug, thiserror::Error)]
pub enum BookmarkUseCaseError {
    #[error("repository error: {0}")]
    Repository(#[from] BookmarkRepositoryError),
    #[error("internal error: {0}")]
    Internal(#[from] crate::error::Error),
}

pub struct BookmarkUseCase {
    pub bookmark_repository: std::sync::Arc<dyn BookmarkRepository + Send + Sync>,
}

impl BookmarkUseCase {
    pub async fn list_bookmark(&self) -> Result<Vec<BookmarkEntity>, BookmarkUseCaseError> {
        let response = self.bookmark_repository.list_bookmark().await?;

        let bookmarks = response
            .iter()
            .map(|bookmark| BookmarkEntity::try_from(bookmark.to_owned()))
            .collect::<Result<Vec<BookmarkEntity>, crate::error::Error>>()?;

        Ok(bookmarks)
    }

    pub async fn create_bookmark(
        &self,
        name: &str,
        url: &str,
    ) -> Result<BookmarkEntity, BookmarkUseCaseError> {
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

        let bookmark = BookmarkEntity::try_from(response)?;

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
    use crate::bookmark::repository::BookmarkRepositoryStub;

    #[tokio::test]
    async fn list_bookmark() {
        let bookmark_repository = std::sync::Arc::new(BookmarkRepositoryStub);

        let bookmark_use_case = BookmarkUseCase {
            bookmark_repository,
        };

        let _bookmark = bookmark_use_case
            .bookmark_repository
            .list_bookmark()
            .await
            .expect("list_bookmark failed");
    }

    #[tokio::test]
    async fn create_bookmark() {
        let bookmark_repository = std::sync::Arc::new(BookmarkRepositoryStub);

        let bookmark_use_case = BookmarkUseCase {
            bookmark_repository,
        };

        let _bookmark = bookmark_use_case
            .create_bookmark("name", "https://example.com")
            .await
            .expect("create_bookmark failed");
    }
}
