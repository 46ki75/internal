use notionrs::r#trait::Paginate;
use notionrs_types::prelude::*;

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

            let icon_data_source_id =
                crate::cache::get_or_init_notion_icon_data_source_id().await?;

            let pages = notionrs_client
                .query_data_source()
                .data_source_id(icon_data_source_id)
                .paginate_send()
                .await
                .map_err(|e| {
                    let error_message = format!("Notion API error: {}", e);
                    log::error!("{}", error_message);
                    crate::error::Error::NotionRs(error_message)
                })?;

            let mut idon_dtos: Vec<super::dto::IconDto> = Vec::new();

            for page in pages.results {
                let maybe_url = page.icon.and_then(|icon| match icon {
                    notionrs_types::prelude::Icon::File(file) => Some(file.get_url()),
                    notionrs_types::prelude::Icon::Emoji(..) => None,
                    notionrs_types::prelude::Icon::CustomEmoji(custom_emoji) => {
                        Some(custom_emoji.custom_emoji.url)
                    }
                });

                if let Some(url) = maybe_url {
                    let id = page.id;

                    let name = page
                        .properties
                        .get("Name")
                        .and_then(|prop| match prop {
                            PageProperty::Title(title_property) => {
                                let text = title_property
                                    .title
                                    .iter()
                                    .map(|t| t.to_string())
                                    .collect::<String>()
                                    .into();

                                Some(text)
                            }
                            _ => None,
                        })
                        .unwrap_or_else(|| "Unnamed Icon".to_string());

                    let icon_dto = super::dto::IconDto { id, url, name };

                    idon_dtos.push(icon_dto);
                } else {
                    continue;
                };
            }

            Ok(idon_dtos)
        })
    }
}
