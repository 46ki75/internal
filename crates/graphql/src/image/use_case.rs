use std::sync::Arc;

pub struct ImageUseCase {
    pub repository: Arc<dyn super::repository::ImageRepository + Send + Sync>,
}

pub mod input {}

pub mod output {
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
        pub uploaded_at: Option<String>,
        pub images: Vec<String>,
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
                uploaded_at: value
                    .uploaded_at
                    .date
                    .and_then(|d| d.start)
                    .map(|dt| dt.to_string()),
                images: value
                    .images
                    .files
                    .into_iter()
                    .map(|f| f.get_url())
                    .collect(),
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

impl ImageUseCase {
    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    pub async fn fetch_images(&self) -> Result<output::ImagePageOutput, crate::error::Error> {
        let dto = self.repository.fetch_images().await?;
        Ok(output::ImagePageOutput::from(dto))
    }
}
