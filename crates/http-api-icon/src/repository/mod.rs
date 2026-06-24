pub mod input;
pub mod output;

use futures::TryStreamExt;
use futures::stream::StreamExt;
use http::header::CONTENT_TYPE;
use notionrs::PaginateExt;

#[derive(Debug, thiserror::Error)]
pub enum IconRepositoryError {
    #[error("Notion API error: {0}")]
    NotionApi(String),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

pub trait IconRepository {
    fn list_icons(
        &self,
    ) -> std::pin::Pin<
        Box<dyn Future<Output = Result<Vec<self::output::IconDto>, IconRepositoryError>> + Send>,
    >;

    /// Resolves the `Content-Type` of an icon via a `HEAD` request. Kept on the
    /// repository (not the use_case) so the use_case stays I/O-free and testable.
    fn fetch_content_type(
        &self,
        url: String,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<Option<String>, IconRepositoryError>> + Send>>;
}

#[derive(Debug, Default)]
#[non_exhaustive]
pub struct IconRepositoryImpl;

impl IconRepository for IconRepositoryImpl {
    fn list_icons(
        &self,
    ) -> std::pin::Pin<
        Box<dyn Future<Output = Result<Vec<self::output::IconDto>, IconRepositoryError>> + Send>,
    > {
        Box::pin(async move {
            let notionrs_client = http_api_core::cache::get_or_init_notionrs_client().await?;

            let icons = notionrs_client
                .list_custom_emojis()
                .into_stream()
                .map(|icon| match icon {
                    Ok(icon) => Ok(self::output::IconDto {
                        id: icon.id,
                        url: icon.url,
                        name: icon.name,
                    }),
                    Err(e) => Err(IconRepositoryError::NotionApi(format!(
                        "Notion API error: {}",
                        e
                    ))),
                })
                .try_collect::<Vec<_>>()
                .await?;

            Ok(icons)
        })
    }

    fn fetch_content_type(
        &self,
        url: String,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<Option<String>, IconRepositoryError>> + Send>>
    {
        Box::pin(async move {
            let client = http_api_core::cache::get_or_init_reqwest_client().await?;

            let content_type = client.head(&url).send().await.ok().and_then(|res| {
                res.headers()
                    .get(CONTENT_TYPE)
                    .and_then(|c| c.to_str().ok().map(|s| s.to_string()))
            });

            Ok(content_type)
        })
    }
}

pub struct IconRepositoryStub;

impl IconRepository for IconRepositoryStub {
    fn list_icons(
        &self,
    ) -> std::pin::Pin<
        Box<dyn Future<Output = Result<Vec<self::output::IconDto>, IconRepositoryError>> + Send>,
    > {
        Box::pin(async move {
            Ok(vec![
                self::output::IconDto {
                    id: "icon-1".to_string(),
                    url: "https://example.com/alpha.png".to_string(),
                    name: "alpha".to_string(),
                },
                self::output::IconDto {
                    id: "icon-2".to_string(),
                    url: "https://example.com/beta.png".to_string(),
                    name: "beta".to_string(),
                },
            ])
        })
    }

    fn fetch_content_type(
        &self,
        _url: String,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<Option<String>, IconRepositoryError>> + Send>>
    {
        Box::pin(async move { Ok(Some("image/png".to_string())) })
    }
}
