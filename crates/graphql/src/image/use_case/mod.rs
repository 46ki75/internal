pub mod input;
pub mod output;

use std::sync::Arc;

pub struct ImageUseCase {
    pub repository: Arc<dyn crate::image::repository::ImageRepository + Send + Sync>,
}

impl ImageUseCase {
    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    pub async fn fetch_images(&self) -> Result<output::ImagePageOutput, crate::error::Error> {
        let dto = self.repository.fetch_images().await?;
        Ok(output::ImagePageOutput::from(dto))
    }

    #[cfg_attr(not(rust_analyzer), tracing::instrument(skip(self), err))]
    pub async fn fetch_image_tags(
        &self,
    ) -> Result<Vec<output::ImageTagOutput>, crate::error::Error> {
        let dtos = self.repository.fetch_image_tags().await?;
        Ok(dtos.into_iter().map(output::ImageTagOutput::from).collect())
    }
}
