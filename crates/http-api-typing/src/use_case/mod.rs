pub mod input;
pub mod output;

use crate::repository::{TypingRepository, TypingRepositoryError};
use output::TypingEntity;
use uuid::Uuid;

#[derive(Debug, thiserror::Error)]
pub enum TypingUseCaseError {
    #[error("invalid typing item ID: {0}")]
    InvalidId(String),
    #[error("typing item not found: {0}")]
    NotFound(String),
    #[error("repository error: {0}")]
    Repository(TypingRepositoryError),
}

fn validate_id(id: String) -> Result<String, TypingUseCaseError> {
    Uuid::parse_str(&id)
        .map(|id| id.to_string())
        .map_err(|_| TypingUseCaseError::InvalidId(id))
}

impl From<TypingRepositoryError> for TypingUseCaseError {
    fn from(error: TypingRepositoryError) -> Self {
        match error {
            TypingRepositoryError::NotFound(id) => Self::NotFound(id),
            error => Self::Repository(error),
        }
    }
}

pub struct TypingUseCase {
    pub typing_repository: std::sync::Arc<dyn TypingRepository + Send + Sync>,
}

impl TypingUseCase {
    pub async fn typing_list(&self) -> Result<Vec<TypingEntity>, TypingUseCaseError> {
        let records: Vec<crate::repository::output::TypingDto> =
            self.typing_repository.typing_list().await?;

        let results = records
            .into_iter()
            .map(|record| TypingEntity {
                id: record.id,
                text: record.text,
                description: record.description,
                completion_count: record.completion_count,
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
        let id = match id {
            Some(id) => validate_id(id)?,
            None => Uuid::now_v7().to_string(),
        };

        let record = self
            .typing_repository
            .upsert_typing(id, text, description)
            .await?;

        Ok(TypingEntity {
            id: record.id,
            text: record.text,
            description: record.description,
            completion_count: record.completion_count,
        })
    }

    pub async fn delete_typing(&self, id: String) -> Result<TypingEntity, TypingUseCaseError> {
        let id = validate_id(id)?;
        let record = self.typing_repository.delete_typing(id).await?;

        Ok(TypingEntity {
            id: record.id,
            text: record.text,
            description: record.description,
            completion_count: record.completion_count,
        })
    }

    pub async fn complete_typing(&self, id: String) -> Result<TypingEntity, TypingUseCaseError> {
        let id = validate_id(id)?;
        let record = self.typing_repository.complete_typing(id).await?;

        Ok(TypingEntity {
            id: record.id,
            text: record.text,
            description: record.description,
            completion_count: record.completion_count,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::output::TypingDto;

    /// A stub that echoes the `id` it was handed back into the returned record,
    /// so tests can observe whether the use case generated or canonicalized an
    /// ID. The default `TypingRepositoryStub` discards the ID, which hides that
    /// branch.
    struct EchoIdStub;

    #[async_trait::async_trait]
    impl crate::repository::TypingRepository for EchoIdStub {
        async fn typing_list(
            &self,
        ) -> Result<Vec<TypingDto>, crate::repository::TypingRepositoryError> {
            unreachable!("not used in these tests")
        }

        async fn upsert_typing(
            &self,
            id: String,
            text: String,
            description: String,
        ) -> Result<TypingDto, crate::repository::TypingRepositoryError> {
            Ok(TypingDto {
                id,
                text,
                description,
                completion_count: 0,
            })
        }

        async fn delete_typing(
            &self,
            id: String,
        ) -> Result<TypingDto, crate::repository::TypingRepositoryError> {
            Ok(TypingDto {
                id,
                text: String::new(),
                description: String::new(),
                completion_count: 0,
            })
        }

        async fn complete_typing(
            &self,
            id: String,
        ) -> Result<TypingDto, crate::repository::TypingRepositoryError> {
            Ok(TypingDto {
                id,
                text: "text".to_string(),
                description: "description".to_string(),
                completion_count: 4,
            })
        }
    }

    #[tokio::test]
    async fn typing_list_maps_records() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(crate::repository::TypingRepositoryStub),
        };

        let list = typing_use_case.typing_list().await.unwrap();

        assert_eq!(list.len(), 2);
        assert_eq!(list[0].id, "93165a44-43c8-4790-84ad-08de54ec549a");
        assert_eq!(list[0].text, "text");
        assert_eq!(list[0].description, "description");
        assert_eq!(list[0].completion_count, 2);
    }

    #[tokio::test]
    async fn upsert_with_none_id_generates_uuid_v7() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let entity = typing_use_case
            .upsert_typing(None, "text".to_string(), "description".to_string())
            .await
            .unwrap();

        let id = Uuid::parse_str(&entity.id).unwrap();
        assert_eq!(id.get_version_num(), 7);
        assert_eq!(entity.text, "text");
        assert_eq!(entity.description, "description");
    }

    #[tokio::test]
    async fn upsert_with_valid_id_canonicalizes_it() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let entity = typing_use_case
            .upsert_typing(
                Some("680008C4-D898-4202-8102-137CD9256595".to_string()),
                "text".to_string(),
                "description".to_string(),
            )
            .await
            .unwrap();

        assert_eq!(entity.id, "680008c4-d898-4202-8102-137cd9256595");
    }

    #[tokio::test]
    async fn upsert_with_invalid_id_is_rejected() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let error = typing_use_case
            .upsert_typing(
                Some("not-a-uuid".to_string()),
                "text".to_string(),
                "description".to_string(),
            )
            .await
            .unwrap_err();

        assert!(matches!(
            error,
            TypingUseCaseError::InvalidId(id) if id == "not-a-uuid"
        ));
    }

    #[tokio::test]
    async fn delete_typing_maps_record() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(crate::repository::TypingRepositoryStub),
        };

        let entity = typing_use_case
            .delete_typing("680008c4-d898-4202-8102-137cd9256595".to_string())
            .await
            .unwrap();

        assert_eq!(entity.id, "680008c4-d898-4202-8102-137cd9256595");
    }

    #[tokio::test]
    async fn delete_with_invalid_id_is_rejected() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let error = typing_use_case
            .delete_typing("not-a-uuid".to_string())
            .await
            .unwrap_err();

        assert!(matches!(
            error,
            TypingUseCaseError::InvalidId(id) if id == "not-a-uuid"
        ));
    }

    #[tokio::test]
    async fn complete_typing_maps_updated_count() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let entity = typing_use_case
            .complete_typing("680008c4-d898-4202-8102-137cd9256595".to_string())
            .await
            .unwrap();

        assert_eq!(entity.id, "680008c4-d898-4202-8102-137cd9256595");
        assert_eq!(entity.completion_count, 4);
    }

    #[tokio::test]
    async fn completion_with_invalid_id_is_rejected() {
        let typing_use_case = TypingUseCase {
            typing_repository: std::sync::Arc::new(EchoIdStub),
        };

        let error = typing_use_case
            .complete_typing("not-a-uuid".to_string())
            .await
            .unwrap_err();

        assert!(matches!(
            error,
            TypingUseCaseError::InvalidId(id) if id == "not-a-uuid"
        ));
    }
}
