pub struct TypingService {
    pub typing_repository:
        std::sync::Arc<dyn crate::repository::typing::TypingRepository + Send + Sync>,
}

impl TypingService {
    pub async fn typing_list(
        &self,
    ) -> Result<Vec<crate::model::typing::Typing>, crate::error::Error> {
        let records = self.typing_repository.typing_list().await?;

        let results = records
            .into_iter()
            .map(|record| crate::model::typing::Typing {
                id: record.id,
                text: record.text,
                description: record.description,
            })
            .collect::<Vec<crate::model::typing::Typing>>();

        Ok(results)
    }

    pub async fn upsert_typing(
        &self,
        text: String,
        description: String,
    ) -> Result<crate::model::typing::Typing, crate::error::Error> {
        let id = uuid::Uuid::new_v4().to_string();

        let record = self
            .typing_repository
            .upsert_typing(id, text, description)
            .await?;

        Ok(crate::model::typing::Typing {
            id: record.id,
            text: record.text,
            description: record.description,
        })
    }

    pub async fn delete_typing(
        &self,
        id: String,
    ) -> Result<crate::model::typing::Typing, crate::error::Error> {
        let record = self.typing_repository.delete_typing(id).await?;

        Ok(crate::model::typing::Typing {
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
    async fn test_typing_list() -> Result<(), crate::error::Error> {
        let typing_repository =
            std::sync::Arc::new(crate::repository::typing::TypingRepositoryStub);

        let typing_service = TypingService { typing_repository };

        let _ = typing_service.typing_list().await?;

        Ok(())
    }

    #[tokio::test]
    async fn test_upsert_typing() -> Result<(), crate::error::Error> {
        let typing_repository =
            std::sync::Arc::new(crate::repository::typing::TypingRepositoryStub);

        let typing_service = TypingService { typing_repository };

        let _ = typing_service
            .upsert_typing("text".to_string(), "description".to_string())
            .await?;

        Ok(())
    }

    #[tokio::test]
    async fn test_delete_typing() -> Result<(), crate::error::Error> {
        let typing_repository =
            std::sync::Arc::new(crate::repository::typing::TypingRepositoryStub);

        let typing_service = TypingService { typing_repository };

        let _ = typing_service.delete_typing("id".to_string()).await?;

        Ok(())
    }
}
