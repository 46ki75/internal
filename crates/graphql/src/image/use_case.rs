pub struct ImageUseCase<T>
where
    T: super::repository::ImageRepository + Send,
{
    pub repository: T,
}

mod input {}

mod output {
    use super::super::dto::*;
    use notionrs::types::prelude::*;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ImagePageOutput {
        pub images: Vec<ImageOutput>,
        pub next_cursor: Option<String>,
    }

    impl From<ImagePageDto> for ImagePageOutput {
        fn from(value: ImagePageDto) -> Self {
            Self {
                images: value.images.into_iter().map(ImageOutput::from).collect(),
                next_cursor: value.next_cursor,
            }
        }
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ImageOutput {
        pub title: String,
        pub name: String,
        pub sources: Vec<ImageSourceOutput>,
        pub url: Option<String>,
        pub tags: Vec<String>,
        pub notable_tags: Vec<String>,
        pub updated_at: String,
    }

    impl From<ImageDto> for ImageOutput {
        fn from(value: ImageDto) -> Self {
            Self {
                title: value
                    .title
                    .title
                    .into_iter()
                    .map(|t| t.to_string())
                    .collect(),
                name: value
                    .name
                    .rich_text
                    .into_iter()
                    .map(|t| t.to_string())
                    .collect(),
                sources: value
                    .sources
                    .multi_select
                    .into_iter()
                    .map(ImageSourceOutput::from)
                    .collect(),
                url: value.url.url,
                tags: value.tags.relation.into_iter().map(|r| r.id).collect(),
                notable_tags: value
                    .notable_tags
                    .relation
                    .into_iter()
                    .map(|r| r.id)
                    .collect(),
                updated_at: value.updated_at,
            }
        }
    }

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub struct ImageSourceOutput {
        pub id: String,
        pub name: String,
        pub color: String,
    }

    impl From<Select> for ImageSourceOutput {
        fn from(value: Select) -> Self {
            Self {
                id: value.id.unwrap_or_default(),
                name: value.name,
                color: value.color.map(|c| c.to_string()).unwrap_or_default(),
            }
        }
    }
}

impl<T> ImageUseCase<T>
where
    T: super::repository::ImageRepository + Send,
{
    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    pub async fn fetch_images(&self) -> Result<output::ImagePageOutput, crate::error::Error> {
        let dto = self.repository.fetch_images().await?;
        Ok(output::ImagePageOutput::from(dto))
    }
}
