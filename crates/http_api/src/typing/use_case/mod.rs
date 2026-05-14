pub mod input;
pub mod output;

use crate::typing::repository::{TypingRepository, TypingRepositoryError};
use output::TypingEntity;

#[derive(Debug, thiserror::Error)]
pub enum TypingUseCaseError {
    #[error("repository error: {0}")]
    Repository(#[from] TypingRepositoryError),
}

pub struct TypingUseCase {
    pub typing_repository: std::sync::Arc<dyn TypingRepository + Send + Sync>,
}

impl TypingUseCase {
    pub async fn typing_list(&self) -> Result<Vec<TypingEntity>, TypingUseCaseError> {
        let records: Vec<crate::typing::repository::output::TypingDto> =
            self.typing_repository.typing_list().await?;

        let results = records
            .into_iter()
            .map(|record| TypingEntity {
                id: record.id,
                text: record.text,
                description: record.description,
            })
            .collect::<Vec<TypingEntity>>();

        Ok(results)
    }

    pub async fn upsert_typing(
        &self,
        id: Option<String>,
        text: String,
        description: String,
    ) -> Result<TypingEntity, TypingUseCaseError> {
        let id = id.unwrap_or(uuid::Uuid::new_v4().to_string());

        let record = self
            .typing_repository
            .upsert_typing(id, text, description)
            .await?;

        Ok(TypingEntity {
            id: record.id,
            text: record.text,
            description: record.description,
        })
    }

    pub async fn delete_typing(&self, id: String) -> Result<TypingEntity, TypingUseCaseError> {
        let record = self.typing_repository.delete_typing(id).await?;

        Ok(TypingEntity {
            id: record.id,
            text: record.text,
            description: record.description,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_typing_list() -> Result<(), TypingUseCaseError> {
        let typing_repository =
            std::sync::Arc::new(crate::typing::repository::TypingRepositoryStub);

        let typing_use_case = TypingUseCase { typing_repository };

        let _ = typing_use_case.typing_list().await?;

        Ok(())
    }

    #[tokio::test]
    async fn test_upsert_typing() -> Result<(), TypingUseCaseError> {
        let typing_repository =
            std::sync::Arc::new(crate::typing::repository::TypingRepositoryStub);

        let typing_use_case = TypingUseCase { typing_repository };

        let _ = typing_use_case
            .upsert_typing(None, "text".to_string(), "description".to_string())
            .await?;

        Ok(())
    }

    #[tokio::test]
    async fn test_delete_typing() -> Result<(), TypingUseCaseError> {
        let typing_repository =
            std::sync::Arc::new(crate::typing::repository::TypingRepositoryStub);

        let typing_use_case = TypingUseCase { typing_repository };

        let _ = typing_use_case.delete_typing("id".to_string()).await?;

        Ok(())
    }
}
