pub mod input;
pub mod output;

use crate::repository::{IconRepository, IconRepositoryError};
use futures::future::join_all;
use output::IconEntiry;

#[derive(Debug, thiserror::Error)]
pub enum IconUseCaseError {
    #[error("repository error: {0}")]
    Repository(#[from] IconRepositoryError),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

pub struct IconUseCase {
    pub icon_repository: std::sync::Arc<dyn IconRepository + Send + Sync>,
}

impl IconUseCase {
    pub async fn list_icons(&self) -> Result<Vec<IconEntiry>, IconUseCaseError> {
        let icons: Vec<crate::repository::output::IconDto> =
            self.icon_repository.list_icons().await?;

        let icon_list = join_all(icons.into_iter().map(|icon| {
            let repository = self.icon_repository.clone();
            async move {
                let content_type = repository.fetch_content_type(icon.url.clone()).await?;

                Ok::<IconEntiry, IconUseCaseError>(IconEntiry {
                    id: icon.id,
                    url: icon.url,
                    name: icon.name,
                    content_type,
                })
            }
        }))
        .await
        .into_iter()
        .collect::<Result<Vec<IconEntiry>, IconUseCaseError>>()?;

        Ok(icon_list)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::IconRepositoryStub;

    #[tokio::test]
    async fn list_icons_maps_dtos_and_content_type() {
        let icon_use_case = IconUseCase {
            icon_repository: std::sync::Arc::new(IconRepositoryStub),
        };

        let icons = icon_use_case.list_icons().await.unwrap();

        // join_all preserves input order, so icons line up with the stub's list.
        assert_eq!(icons.len(), 2);
        assert_eq!(icons[0].id, "icon-1");
        assert_eq!(icons[0].url, "https://example.com/alpha.png");
        assert_eq!(icons[0].name, "alpha");
        // The stub resolves a fixed MIME for every icon.
        assert_eq!(icons[0].content_type.as_deref(), Some("image/png"));
        assert_eq!(icons[1].id, "icon-2");
    }
}
