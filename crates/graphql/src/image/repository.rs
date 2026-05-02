use std::pin::Pin;

use futures::TryStreamExt;
use notionrs::PaginateExt;
use notionrs_types::prelude::*;

pub trait ImageRepository {
    fn fetch_images(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<super::dto::ImagePageDto, crate::error::Error>> + Send>>;

    fn fetch_image_tags(
        &self,
    ) -> Pin<
        Box<dyn Future<Output = Result<Vec<super::dto::ImageTagDto>, crate::error::Error>> + Send>,
    >;
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
                "/{stage_name}/46ki75/internal/notion/image/data_source/id"
            ))
            .await?;

            let res: ListResponse<notionrs_types::prelude::PageResponse<super::dto::ImageDto>> =
                notionrs_client
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

    fn fetch_image_tags(
        &self,
    ) -> Pin<
        Box<dyn Future<Output = Result<Vec<super::dto::ImageTagDto>, crate::error::Error>> + Send>,
    > {
        Box::pin(async move {
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;
            let stage_name = crate::cache::get_or_init_stage_name().await?;
            let data_source_id = crate::cache::get_parameter(format!(
                "/{stage_name}/46ki75/internal/notion/image_tag/data_source/id"
            ))
            .await?;

            let image_tags = notionrs_client
                .query_data_source::<super::dto::ImageTagDto>()
                .data_source_id(data_source_id)
                .into_stream()
                .try_collect::<Vec<_>>()
                .await?
                .into_iter()
                .map(|image_tag| image_tag.properties)
                .collect::<Vec<_>>();

            Ok(image_tags)
        })
    }
}
