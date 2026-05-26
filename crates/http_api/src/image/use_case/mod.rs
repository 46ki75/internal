pub mod input;
pub mod output;

use std::sync::Arc;

use crate::image::repository::ImageRepositoryError;

#[derive(Debug, thiserror::Error)]
pub enum ImageUseCaseError {
    #[error("repository error: {0}")]
    Repository(#[from] ImageRepositoryError),
}

pub struct ImageUseCase {
    pub repository: Arc<dyn crate::image::repository::ImageRepository + Send + Sync>,
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
