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
    use crate::typing::repository::output::TypingDto;

    /// A stub that echoes the `id` it was handed back into the returned record,
    /// so tests can observe whether the use case generated a UUID or passed the
    /// caller's id through. The default `TypingRepositoryStub` discards the id,
    /// which hides that branch.
    struct EchoIdStub;

    #[async_trait::async_trait]
    impl crate::typing::repository::TypingRepository for EchoIdStub {
        async fn typing_list(
            &self,
        ) -> Result<Vec<TypingDto>, crate::typing::repository::TypingRepositoryError> {
            unreachable!("not used in these tests")
        }

        async fn upsert_typing(
            &self,
            id: String,
            text: String,
            description: String,
        ) -> Result<TypingDto, crate::typing::repository::TypingRepositoryError> {
            Ok(TypingDto {
                id,
                text,
                description,
            })
        }

        async fn delete_typing(
            &self,
            id: String,
        ) -> Result<TypingDto, crate::typing::repository::TypingRepositoryError> {
            Ok(TypingDto {
                id,
                text: String::new(),
                description: String::new(),
            })
        }
    }

    #[tokio::test]
    async fn typing_list_maps_records() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(crate::typing::repository::TypingRepositoryStub),
        };

        let list = typing_use_case.typing_list().await.unwrap();

        assert_eq!(list.len(), 2);
        assert_eq!(list[0].id, "93165a44-43c8-4790-84ad-08de54ec549a");
        assert_eq!(list[0].text, "text");
        assert_eq!(list[0].description, "description");
    }

    #[tokio::test]
    async fn upsert_with_none_id_generates_uuid() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let entity = typing_use_case
            .upsert_typing(None, "text".to_string(), "description".to_string())
            .await
            .unwrap();

        // The use case fills in a v4 UUID, which the echo stub returns verbatim.
        assert!(uuid::Uuid::parse_str(&entity.id).is_ok());
        assert_eq!(entity.text, "text");
        assert_eq!(entity.description, "description");
    }

    #[tokio::test]
    async fn upsert_with_some_id_passes_it_through() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let entity = typing_use_case
            .upsert_typing(
                Some("my-id".to_string()),
                "text".to_string(),
                "description".to_string(),
            )
            .await
            .unwrap();

        assert_eq!(entity.id, "my-id");
    }

    #[tokio::test]
    async fn delete_typing_maps_record() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(crate::typing::repository::TypingRepositoryStub),
        };

        let entity = typing_use_case
            .delete_typing("id".to_string())
            .await
            .unwrap();

        assert_eq!(entity.id, "680008c4-d898-4202-8102-137cd9256595");
    }
}
