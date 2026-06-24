pub mod input;
pub mod output;

use std::sync::Arc;

use crate::repository::ImageRepositoryError;

#[derive(Debug, thiserror::Error)]
pub enum ImageUseCaseError {
    #[error("repository error: {0}")]
    Repository(#[from] ImageRepositoryError),
}

pub struct ImageUseCase {
    pub repository: Arc<dyn crate::repository::ImageRepository + Send + Sync>,
}

impl ImageUseCase {
    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    pub async fn fetch_images(&self) -> Result<output::ImagePageOutput, ImageUseCaseError> {
        let dto = self.repository.fetch_images().await?;
        Ok(output::ImagePageOutput::from(dto))
    }

    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    pub async fn fetch_image_tags(&self) -> Result<Vec<output::ImageTagOutput>, ImageUseCaseError> {
        let dtos = self.repository.fetch_image_tags().await?;
        Ok(dtos.into_iter().map(output::ImageTagOutput::from).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::ImageRepositoryStub;

    #[tokio::test]
    async fn fetch_images_maps_dtos() {
        let use_case = ImageUseCase {
            repository: Arc::new(ImageRepositoryStub),
        };

        let page = use_case.fetch_images().await.unwrap();

        assert_eq!(page.images.len(), 1);
        assert_eq!(page.images[0].title, "alpha");
        assert_eq!(page.images[0].name, "alpha-name");
        assert_eq!(
            page.images[0].url.as_deref(),
            Some("https://example.com/alpha.png")
        );
        assert!(page.next_cursor.is_none());
    }

    #[tokio::test]
    async fn fetch_image_tags_maps_dtos() {
        let use_case = ImageUseCase {
            repository: Arc::new(ImageRepositoryStub),
        };

        let tags = use_case.fetch_image_tags().await.unwrap();

        assert_eq!(tags.len(), 1);
        assert_eq!(tags[0].tag_name, "artist-tag");
        assert_eq!(tags[0].url, "https://example.com/artist");
        assert_eq!(tags[0].tag_type, "Artist");
    }
}
