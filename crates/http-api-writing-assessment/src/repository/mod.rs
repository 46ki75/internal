mod dynamodb;
mod openrouter;

pub use dynamodb::DynamoDbAssessmentPersistence;
pub use openrouter::OpenRouterAssessmentGenerator;

use crate::use_case::domain::{Assessment, GeneratedAssessment};

#[derive(Debug, thiserror::Error)]
pub enum GeneratorError {
    #[error("generator configuration error: {0}")]
    Configuration(String),
    #[error("generator upstream error: {0}")]
    Upstream(String),
    #[error("invalid generator response: {0}")]
    InvalidResponse(String),
}

#[derive(Debug, thiserror::Error)]
pub enum PersistenceError {
    #[error("writing assessment not found: {0}")]
    NotFound(String),
    #[error("DynamoDB error: {0}")]
    DynamoDb(String),
    #[error("invalid persisted assessment: {0}")]
    InvalidData(String),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

#[async_trait::async_trait]
pub trait AssessmentGenerator {
    async fn generate(
        &self,
        text: &str,
        japanese_context: Option<&str>,
    ) -> Result<(GeneratedAssessment, String), GeneratorError>;
}

#[async_trait::async_trait]
pub trait AssessmentPersistence {
    async fn list(&self) -> Result<Vec<Assessment>, PersistenceError>;
    async fn get(&self, id: &str) -> Result<Assessment, PersistenceError>;
    async fn put(&self, assessment: &Assessment) -> Result<(), PersistenceError>;
    async fn delete(&self, id: &str) -> Result<Assessment, PersistenceError>;
}
