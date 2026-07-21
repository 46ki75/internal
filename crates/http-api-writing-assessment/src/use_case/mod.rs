pub mod domain;

use std::sync::Arc;

use chrono::Utc;
use domain::{Assessment, AssessmentLabel, Feedback, FeedbackType, GeneratedAssessment, Severity};
use uuid::Uuid;

use crate::repository::{
    AssessmentGenerator, AssessmentPersistence, GeneratorError, PersistenceError,
};

#[derive(Debug, thiserror::Error)]
pub enum WritingAssessmentUseCaseError {
    #[error("text must not be blank")]
    BlankText,
    #[error("writing assessment not found: {0}")]
    NotFound(String),
    #[error("generator error: {0}")]
    Generator(#[from] GeneratorError),
    #[error("persistence error: {0}")]
    Persistence(PersistenceError),
}

impl From<PersistenceError> for WritingAssessmentUseCaseError {
    fn from(value: PersistenceError) -> Self {
        match value {
            PersistenceError::NotFound(id) => Self::NotFound(id),
            other => Self::Persistence(other),
        }
    }
}

pub struct WritingAssessmentUseCase {
    pub generator: Arc<dyn AssessmentGenerator + Send + Sync>,
    pub persistence: Arc<dyn AssessmentPersistence + Send + Sync>,
}

impl WritingAssessmentUseCase {
    pub async fn create(
        &self,
        text: String,
        japanese_context: Option<String>,
    ) -> Result<Assessment, WritingAssessmentUseCaseError> {
        if text.trim().is_empty() {
            return Err(WritingAssessmentUseCaseError::BlankText);
        }

        let (generated, model) = self
            .generator
            .generate(&text, japanese_context.as_deref())
            .await?;
        validate_generated(&generated)?;

        let assessment = Assessment {
            id: Uuid::now_v7().to_string(),
            original_text: text,
            japanese_context,
            score: generated.score,
            label: generated.label,
            justification: generated.justification,
            feedback: generated
                .feedback
                .into_iter()
                .map(|feedback| Feedback {
                    id: Uuid::new_v4().to_string(),
                    feedback_type: feedback.feedback_type,
                    layer: feedback.layer,
                    severity: feedback.severity,
                    pattern: feedback.pattern,
                    original: feedback.original,
                    revised: feedback.revised,
                    reason: feedback.reason,
                })
                .collect(),
            revised_text: generated.revised_text,
            register: generated.register,
            model,
            created_at: Utc::now().to_rfc3339(),
            schema_version: 1,
        };

        self.persistence.put(&assessment).await?;
        Ok(assessment)
    }

    pub async fn list(&self) -> Result<Vec<Assessment>, WritingAssessmentUseCaseError> {
        Ok(self.persistence.list().await?)
    }

    pub async fn get(&self, id: &str) -> Result<Assessment, WritingAssessmentUseCaseError> {
        Ok(self.persistence.get(id).await?)
    }

    pub async fn delete(&self, id: &str) -> Result<Assessment, WritingAssessmentUseCaseError> {
        Ok(self.persistence.delete(id).await?)
    }
}

pub fn validate_generated(generated: &GeneratedAssessment) -> Result<(), GeneratorError> {
    if !(1..=5).contains(&generated.score) {
        return Err(GeneratorError::InvalidResponse(
            "score must be between 1 and 5".into(),
        ));
    }
    if AssessmentLabel::for_score(generated.score).as_ref() != Some(&generated.label) {
        return Err(GeneratorError::InvalidResponse(
            "label does not match score".into(),
        ));
    }

    let observations = generated
        .feedback
        .iter()
        .filter(|feedback| feedback.feedback_type == FeedbackType::Observation)
        .collect::<Vec<_>>();
    if observations.len() > 5 {
        return Err(GeneratorError::InvalidResponse(
            "at most five observations are allowed".into(),
        ));
    }

    for feedback in &generated.feedback {
        if feedback.original == feedback.revised {
            return Err(GeneratorError::InvalidResponse(
                "feedback original and revised text must differ".into(),
            ));
        }
        match feedback.feedback_type {
            FeedbackType::Observation => {
                if feedback.layer.is_none() || feedback.pattern.as_deref().is_none_or(str::is_empty)
                {
                    return Err(GeneratorError::InvalidResponse(
                        "observations require layer and pattern".into(),
                    ));
                }
            }
            FeedbackType::Error | FeedbackType::IntentCheck if feedback.layer.is_some() => {
                return Err(GeneratorError::InvalidResponse(
                    "non-observations must omit layer".into(),
                ));
            }
            FeedbackType::Error | FeedbackType::IntentCheck => {}
        }
    }

    let has_applied_feedback = generated.feedback.iter().any(|feedback| {
        matches!(
            feedback.feedback_type,
            FeedbackType::Error | FeedbackType::Observation
        )
    });
    if has_applied_feedback != generated.revised_text.is_some() {
        return Err(GeneratorError::InvalidResponse(
            "revised_text must be present exactly when errors or observations are present".into(),
        ));
    }

    let expected = score_from_observations(&observations);
    if generated.score != expected && !(generated.score == 1 && expected == 2) {
        return Err(GeneratorError::InvalidResponse(format!(
            "score {} does not match count-derived score {expected}",
            generated.score
        )));
    }
    Ok(())
}

fn score_from_observations(observations: &[&domain::GeneratedFeedback]) -> u8 {
    let high = observations
        .iter()
        .filter(|item| item.severity == Severity::High)
        .count();
    let medium_or_high = observations
        .iter()
        .filter(|item| matches!(item.severity, Severity::Medium | Severity::High))
        .count();
    let low = observations
        .iter()
        .filter(|item| item.severity == Severity::Low)
        .count();

    if high >= 2 || medium_or_high >= 4 {
        2
    } else if medium_or_high == 0 && low <= 1 {
        5
    } else if medium_or_high == 0 || medium_or_high == 1 {
        4
    } else {
        3
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use super::*;
    use crate::use_case::domain::{FeedbackLayer, GeneratedFeedback};

    fn observation(severity: Severity) -> GeneratedFeedback {
        GeneratedFeedback {
            feedback_type: FeedbackType::Observation,
            layer: Some(FeedbackLayer::Style),
            severity,
            pattern: Some("wordiness".into()),
            original: "very long".into(),
            revised: "long".into(),
            reason: "More concise.".into(),
        }
    }

    fn generated(score: u8, feedback: Vec<GeneratedFeedback>) -> GeneratedAssessment {
        GeneratedAssessment {
            score,
            label: AssessmentLabel::for_score(score).unwrap(),
            justification: "Clear overall.".into(),
            revised_text: (!feedback.is_empty()).then(|| "Revised text.".into()),
            feedback,
            register: "neutral".into(),
        }
    }

    #[test]
    fn validates_count_derived_scores_and_score_one_exception() {
        assert!(validate_generated(&generated(5, vec![])).is_ok());
        assert!(validate_generated(&generated(4, vec![observation(Severity::Low); 2])).is_ok());
        assert!(validate_generated(&generated(3, vec![observation(Severity::Medium); 2])).is_ok());
        assert!(validate_generated(&generated(2, vec![observation(Severity::High); 2])).is_ok());
        assert!(validate_generated(&generated(1, vec![observation(Severity::High); 2])).is_ok());
        assert!(validate_generated(&generated(5, vec![observation(Severity::Medium)])).is_err());
    }

    #[test]
    fn rejects_invalid_feedback_shape() {
        let mut value = generated(5, vec![]);
        value.feedback = vec![GeneratedFeedback {
            feedback_type: FeedbackType::Error,
            layer: Some(FeedbackLayer::Idiom),
            severity: Severity::Low,
            pattern: None,
            original: "x".into(),
            revised: "x".into(),
            reason: "reason".into(),
        }];
        value.revised_text = Some("y".into());
        assert!(validate_generated(&value).is_err());
    }

    #[test]
    fn intent_check_alone_does_not_require_revised_text() {
        let value = generated(
            5,
            vec![GeneratedFeedback {
                feedback_type: FeedbackType::IntentCheck,
                layer: None,
                severity: Severity::Medium,
                pattern: None,
                original: "disable the cache".into(),
                revised: "invalidate the cache".into(),
                reason: "Confirm the intended cache operation.".into(),
            }],
        );
        let mut value = value;
        value.revised_text = None;

        assert!(validate_generated(&value).is_ok());
    }

    struct GeneratorStub;

    #[async_trait::async_trait]
    impl AssessmentGenerator for GeneratorStub {
        async fn generate(
            &self,
            _text: &str,
            _japanese_context: Option<&str>,
        ) -> Result<(GeneratedAssessment, String), GeneratorError> {
            Ok((
                generated(4, vec![observation(Severity::Medium)]),
                "stub-model".into(),
            ))
        }
    }

    #[derive(Default)]
    struct PersistenceStub {
        saved: Mutex<Option<Assessment>>,
    }

    #[async_trait::async_trait]
    impl AssessmentPersistence for PersistenceStub {
        async fn list(&self) -> Result<Vec<Assessment>, PersistenceError> {
            unreachable!()
        }
        async fn get(&self, _id: &str) -> Result<Assessment, PersistenceError> {
            unreachable!()
        }
        async fn put(&self, value: &Assessment) -> Result<(), PersistenceError> {
            *self.saved.lock().unwrap() = Some(value.clone());
            Ok(())
        }
        async fn delete(&self, _id: &str) -> Result<Assessment, PersistenceError> {
            unreachable!()
        }
    }

    #[tokio::test]
    async fn create_assigns_server_fields_and_persists() {
        let persistence = Arc::new(PersistenceStub::default());
        let use_case = WritingAssessmentUseCase {
            generator: Arc::new(GeneratorStub),
            persistence: persistence.clone(),
        };

        let result = use_case
            .create("Original".into(), Some("Context".into()))
            .await
            .unwrap();

        assert_eq!(Uuid::parse_str(&result.id).unwrap().get_version_num(), 7);
        assert_eq!(
            Uuid::parse_str(&result.feedback[0].id)
                .unwrap()
                .get_version_num(),
            4
        );
        assert_eq!(result.model, "stub-model");
        assert_eq!(result.schema_version, 1);
        assert_eq!(persistence.saved.lock().unwrap().as_ref(), Some(&result));
    }

    #[tokio::test]
    async fn blank_text_never_calls_dependencies() {
        let use_case = WritingAssessmentUseCase {
            generator: Arc::new(GeneratorStub),
            persistence: Arc::new(PersistenceStub::default()),
        };
        assert!(matches!(
            use_case.create("  \n".into(), None).await,
            Err(WritingAssessmentUseCaseError::BlankText)
        ));
    }
}
