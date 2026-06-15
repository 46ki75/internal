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
        resolve_favicon_url(&html, url)
    }
}

/// Extracts the favicon href from `html` and resolves it against `page_url`'s
/// scheme and host into an absolute URL. Returns `None` when the page has no
/// favicon link, when `page_url` is unparseable, or when it carries no host.
fn resolve_favicon_url(html: &str, page_url: &str) -> Option<String> {
    let scraper = html_meta_scraper::MetaScraper::new(html);

    let favicon = format!("/{}", scraper.favicon()?).replace("//", "/");

    let url = url::Url::parse(page_url).ok()?;

    let favicon_url = format!("{}://{}{}", url.scheme(), url.host()?, favicon);

    Some(favicon_url)
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::bookmark::repository::BookmarkRepositoryStub;

    // ---- resolve_favicon_url (pure) ----

    #[test]
    fn favicon_relative_href_is_resolved_against_host() {
        let html = r#"<link rel="icon" href="favicon.ico" />"#;
        let result = resolve_favicon_url(html, "https://example.com/some/path");
        assert_eq!(result, Some("https://example.com/favicon.ico".to_string()));
    }

    #[test]
    fn favicon_absolute_path_href_collapses_double_slash() {
        let html = r#"<link rel="icon" href="/static/icon.png" />"#;
        let result = resolve_favicon_url(html, "https://example.com/some/path");
        assert_eq!(
            result,
            Some("https://example.com/static/icon.png".to_string())
        );
    }

    #[test]
    fn favicon_missing_link_is_none() {
        let html = r#"<html><head><title>no icon</title></head></html>"#;
        assert_eq!(resolve_favicon_url(html, "https://example.com"), None);
    }

    #[test]
    fn favicon_unparseable_page_url_is_none() {
        let html = r#"<link rel="icon" href="/favicon.ico" />"#;
        assert_eq!(resolve_favicon_url(html, "not a url"), None);
    }

    #[test]
    fn favicon_hostless_page_url_is_none() {
        let html = r#"<link rel="icon" href="/favicon.ico" />"#;
        // `mailto:` parses but exposes no host.
        assert_eq!(resolve_favicon_url(html, "mailto:a@b.com"), None);
    }

    // ---- async use-case methods (via stub) ----

    #[tokio::test]
    async fn list_bookmark_returns_converted_entities() {
        let bookmark_use_case = BookmarkUseCase {
            bookmark_repository: std::sync::Arc::new(BookmarkRepositoryStub),
        };

        let bookmarks = bookmark_use_case.list_bookmark().await.unwrap();

        assert_eq!(bookmarks.len(), 1);
        assert_eq!(bookmarks[0].name.as_deref(), Some("三菱UFJダイレクト"));
        assert_eq!(
            bookmarks[0].url.as_deref(),
            Some("https://direct.bk.mufg.jp/index.html")
        );
    }

    #[tokio::test]
    async fn create_bookmark_returns_converted_entity() {
        let bookmark_use_case = BookmarkUseCase {
            bookmark_repository: std::sync::Arc::new(BookmarkRepositoryStub),
        };

        let bookmark = bookmark_use_case
            .create_bookmark("name", "https://example.com")
            .await
            .unwrap();

        // The stub echoes bookmark.json regardless of the input arguments.
        assert_eq!(bookmark.name.as_deref(), Some("三菱UFJダイレクト"));
        assert_eq!(
            bookmark.url.as_deref(),
            Some("https://direct.bk.mufg.jp/index.html")
        );
    }
}
