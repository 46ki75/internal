use futures::TryStreamExt;
use notionrs::PaginateExt;

pub trait IconRepository {
    fn list_icons(
        &self,
    ) -> std::pin::Pin<
        Box<dyn Future<Output = Result<Vec<super::dto::IconDto>, crate::error::Error>> + Send>,
    >;
}

#[derive(Debug, Default)]
#[non_exhaustive]
pub struct IconRepositoryImpl;

impl IconRepository for IconRepositoryImpl {
    fn list_icons(
        &self,
    ) -> std::pin::Pin<
        Box<dyn Future<Output = Result<Vec<super::dto::IconDto>, crate::error::Error>> + Send>,
    > {
        Box::pin(async move {
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

            let icons = notionrs_client
                .list_custom_emojis()
                .into_stream()
                .try_collect::<Vec<_>>()
                .await
                .map_err(|e| {
                    let error_message = format!("Notion API error: {}", e);
                    log::error!("{}", error_message);
                    crate::error::Error::NotionRs(error_message)
                })?
                .into_iter()
                .map(|icon| super::dto::IconDto {
                    id: icon.id,
                    url: icon.url,
                    name: icon.name,
                })
                .collect::<Vec<_>>();

            Ok(icons)
        })
    }
}
