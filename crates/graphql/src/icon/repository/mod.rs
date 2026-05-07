pub mod input;
pub mod output;

use futures::TryStreamExt;
use futures::stream::StreamExt;
use notionrs::PaginateExt;

#[derive(Debug, thiserror::Error)]
pub enum IconRepositoryError {
    #[error("Notion API error: {0}")]
    NotionApi(String),
    #[error("internal error: {0}")]
    Internal(#[from] crate::error::Error),
}

pub trait IconRepository {
    fn list_icons(
        &self,
    ) -> std::pin::Pin<
        Box<dyn Future<Output = Result<Vec<self::output::IconDto>, IconRepositoryError>> + Send>,
    >;
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
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

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
}
