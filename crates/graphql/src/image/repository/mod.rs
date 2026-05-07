pub mod output;

use std::{collections::HashMap, pin::Pin};

use futures::TryStreamExt;
use notionrs::PaginateExt;
use notionrs_types::prelude::*;

#[derive(Debug, thiserror::Error)]
pub enum ImageRepositoryError {
    #[error("Notion API error: {0}")]
    NotionrsClient(#[from] notionrs::Error),
    #[error("serialization error: {0}")]
    SerdePlain(#[from] serde_plain::Error),
    #[error("internal error: {0}")]
    Internal(#[from] crate::error::Error),
}

pub trait ImageRepository {
    fn fetch_images(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<self::output::ImagePageDto, ImageRepositoryError>> + Send>>;

    fn fetch_image_tags(
        &self,
    ) -> Pin<
        Box<dyn Future<Output = Result<Vec<self::output::ImageTagDto>, ImageRepositoryError>> + Send>,
    >;

    fn create_image_tag(
        &self,
        tag_name: String,
        url: String,
        tag_type: self::output::ImageTagTypeDtoInput,
    ) -> Pin<Box<dyn Future<Output = Result<self::output::ImageTagDto, ImageRepositoryError>> + Send>>;
}

pub struct ImageRepositoryImpl {}

impl ImageRepository for ImageRepositoryImpl {
    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    fn fetch_images(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<self::output::ImagePageDto, ImageRepositoryError>> + Send>>
    {
        Box::pin(async move {
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;
            let stage_name = crate::cache::get_or_init_stage_name().await?;
            let data_source_id = crate::cache::get_parameter(format!(
                "/{stage_name}/46ki75/internal/notion/image/data_source/id"
            ))
            .await?;

            let res = notionrs_client
                .query_data_source()
                .typed::<self::output::ImageDto>()
                .data_source_id(data_source_id)
                .send()
                .await?;

            let images = res
                .results
                .into_iter()
                .map(|image| image.properties)
                .collect::<Vec<_>>();

            let next_cursor = res.next_cursor;

            Ok(self::output::ImagePageDto {
                images,
                next_cursor,
            })
        })
    }

    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    fn fetch_image_tags(
        &self,
    ) -> Pin<
        Box<dyn Future<Output = Result<Vec<self::output::ImageTagDto>, ImageRepositoryError>> + Send>,
    > {
        Box::pin(async move {
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;
            let stage_name = crate::cache::get_or_init_stage_name().await?;
            let data_source_id = crate::cache::get_parameter(format!(
                "/{stage_name}/46ki75/internal/notion/image_tag/data_source/id"
            ))
            .await?;

            let image_tags = notionrs_client
                .query_data_source()
                .typed::<self::output::ImageTagDto>()
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

    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    fn create_image_tag(
        &self,
        tag_name: String,
        url: String,
        tag_type: self::output::ImageTagTypeDtoInput,
    ) -> Pin<Box<dyn Future<Output = Result<self::output::ImageTagDto, ImageRepositoryError>> + Send>>
    {
        Box::pin(async move {
            let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;
            let stage_name = crate::cache::get_or_init_stage_name().await?;
            let data_source_id = crate::cache::get_parameter(format!(
                "/{stage_name}/46ki75/internal/notion/image_tag/data_source/id"
            ))
            .await?;

            let mut properties: HashMap<String, PageProperty> = HashMap::new();

            properties.insert(
                "Tag Name".to_owned(),
                PageProperty::Title(PageTitleProperty {
                    title: vec![RichText::from(tag_name)],
                    ..Default::default()
                }),
            );
            properties.insert(
                "URL".to_owned(),
                PageProperty::Url(PageUrlProperty {
                    url: Some(url),
                    ..Default::default()
                }),
            );
            properties.insert(
                "Tag Type".to_owned(),
                PageProperty::Select(PageSelectProperty {
                    select: Some(Select {
                        name: serde_plain::to_string(&tag_type)?,
                        ..Default::default()
                    }),
                    ..Default::default()
                }),
            );

            let response = notionrs_client
                .create_page::<self::output::ImageTagDto>()
                .data_source_id(data_source_id)
                .properties(properties)
                .send()
                .await?;

            Ok(response.properties)
        })
    }
}
