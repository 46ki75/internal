use std::pin::Pin;

pub trait ImageRepository {
    fn fetch_images(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<super::dto::ImagePageDto, crate::error::Error>> + Send>>;
}

pub struct ImageRepositoryImpl {}

impl ImageRepository for ImageRepositoryImpl {
    fn fetch_images(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<super::dto::ImagePageDto, crate::error::Error>> + Send>>
    {
        Box::pin(async move {
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;
            let stage_name = crate::cache::get_or_init_stage_name().await?;
            let data_source_id = crate::cache::get_parameter(format!(
                "/{stage_name}/46ki75/internal/notion/anki/data_source/id"
            ))
            .await?;

            let res: notionrs_types::prelude::ListResponse<
                notionrs_types::prelude::PageResponse<super::dto::ImageDto>,
            > = notionrs_client
                .query_data_source()
                .data_source_id(data_source_id)
                .send()
                .await?;

            let images = res
                .results
                .into_iter()
                .map(|image| image.properties)
                .collect::<Vec<_>>();

            let next_cursor = res.next_cursor;

            Ok(super::dto::ImagePageDto {
                images,
                next_cursor,
            })
        })
    }
}
