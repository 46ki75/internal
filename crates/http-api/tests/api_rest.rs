//! In-process REST API/wiring tests.
//!
//! Each test boots a feature's real Axum router with a stub-backed use_case
//! (via the `*_router(state)` seam) and drives it through `oneshot`. This
//! exercises routing, extractors, response serialization, and error mapping —
//! the layers the use_case unit tests don't reach. Hermetic: no network/AWS.

use std::sync::Arc;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt; // brings `oneshot` into scope

/// GET `path` on `router` and return the status plus the parsed JSON body.
async fn get_json(router: axum::Router, path: &str) -> (StatusCode, serde_json::Value) {
    let response = router
        .oneshot(Request::get(path).body(Body::empty()).unwrap())
        .await
        .unwrap();

    let status = response.status();
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json = if body.is_empty() {
        serde_json::Value::Null
    } else {
        serde_json::from_slice(&body).unwrap()
    };

    (status, json)
}

// ---- writing assessment ----

use http_api::writing_assessment::{
    repository::{
        AssessmentGenerator, AssessmentPersistence, GenerationResult, GeneratorError,
        PersistenceError,
    },
    use_case::{
        WritingAssessmentUseCase,
        domain::{
            Assessment, AssessmentLabel, FeedbackLayer, FeedbackType, GeneratedAssessment,
            GeneratedFeedback, ReasoningEffort, Severity,
        },
    },
};

struct WritingGeneratorStub;

#[async_trait::async_trait]
impl AssessmentGenerator for WritingGeneratorStub {
    async fn generate(
        &self,
        _text: &str,
        _japanese_context: Option<&str>,
    ) -> Result<GenerationResult, GeneratorError> {
        Ok(GenerationResult {
            assessment: GeneratedAssessment {
                score: 4,
                justification: "One idiomatic improvement; polish is optional.".into(),
                feedback: vec![GeneratedFeedback {
                    feedback_type: FeedbackType::Observation,
                    layer: Some(FeedbackLayer::Idiom),
                    severity: Severity::Medium,
                    pattern: Some("light-verb".into()),
                    original: "did the analysis".into(),
                    revised: "analyzed".into(),
                    reason: "The direct verb is idiomatic.".into(),
                }],
                revised_text: Some("We analyzed the logs.".into()),
                register: "neutral".into(),
            },
            model: "test/model".into(),
            reasoning_effort: ReasoningEffort::Medium,
        })
    }
}

struct WritingPersistenceStub;

fn writing_assessment_fixture() -> Assessment {
    Assessment {
        id: "01981f1a-19c0-7000-8000-000000000000".into(),
        original_text: "The deployment completed successfully.".into(),
        japanese_context: None,
        score: 5,
        label: AssessmentLabel::NativeLike,
        justification: "Natural technical phrasing; polish is optional.".into(),
        feedback: vec![],
        revised_text: None,
        register: "neutral".into(),
        model: "test/model".into(),
        reasoning_effort: Some(ReasoningEffort::Medium),
        created_at: "2026-07-21T00:00:00Z".into(),
        schema_version: 2,
    }
}

#[async_trait::async_trait]
impl AssessmentPersistence for WritingPersistenceStub {
    async fn list(&self) -> Result<Vec<Assessment>, PersistenceError> {
        Ok(vec![writing_assessment_fixture()])
    }

    async fn get(&self, _id: &str) -> Result<Assessment, PersistenceError> {
        Ok(writing_assessment_fixture())
    }

    async fn put(&self, _assessment: &Assessment) -> Result<(), PersistenceError> {
        Ok(())
    }

    async fn delete(&self, _id: &str) -> Result<Assessment, PersistenceError> {
        Ok(writing_assessment_fixture())
    }
}

fn writing_assessment_test_router() -> axum::Router {
    let state = Arc::new(
        http_api::writing_assessment::controller::router::WritingAssessmentState {
            use_case: Arc::new(WritingAssessmentUseCase {
                generator: Arc::new(WritingGeneratorStub),
                persistence: Arc::new(WritingPersistenceStub),
            }),
        },
    );
    http_api::writing_assessment::controller::router::writing_assessment_router(state).0
}

#[tokio::test]
async fn writing_assessment_list_returns_saved_assessments() {
    let (status, json) = get_json(
        writing_assessment_test_router(),
        "/api/v1/writing-assessments",
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json[0]["score"], 5);
    assert_eq!(json[0]["label"], "native_like");
}

#[tokio::test]
async fn writing_assessment_create_returns_structured_feedback() {
    let response = writing_assessment_test_router()
        .oneshot(
            Request::post("/api/v1/writing-assessments")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"text":"We did the analysis of the logs."}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["feedback"][0]["type"], "observation");
    assert_eq!(json["feedback"][0]["layer"], "idiom");
    assert_eq!(json["feedback"][0]["severity"], "medium");
    assert_eq!(json["model"], "test/model");
    assert_eq!(json["reasoning_effort"], "medium");
    assert_eq!(json["schema_version"], 2);
}

#[tokio::test]
async fn writing_assessment_create_rejects_blank_text() {
    let response = writing_assessment_test_router()
        .oneshot(
            Request::post("/api/v1/writing-assessments")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"text":"  "}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

// ---- API documentation ----

#[tokio::test]
async fn scalar_ui_is_served() {
    let router = http_api::router::init_router().await.unwrap().clone();
    let response = router
        .oneshot(
            Request::get("/api-gateway/api/v1/scalar")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let content_type = response
        .headers()
        .get("content-type")
        .unwrap()
        .to_str()
        .unwrap();
    assert!(content_type.starts_with("text/html"));
}

#[tokio::test]
async fn openapi_json_remains_available() {
    let router = http_api::router::init_router().await.unwrap().clone();
    let (status, json) = get_json(router, "/api-gateway/api/v1/openapi.json").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["servers"][0]["url"], "/api-gateway");
    assert!(json["paths"]["/api/v1/writing-assessments"].is_object());
}

#[tokio::test]
async fn openapi_typing_is_read_only() {
    let router = http_api::router::init_router().await.unwrap().clone();
    let (status, json) = get_json(router, "/api-gateway/api/v1/openapi.json").await;

    assert_eq!(status, StatusCode::OK);
    let paths = json["paths"].as_object().unwrap();
    let typing = paths["/api/v1/typing"].as_object().unwrap();
    assert_eq!(
        typing.keys().map(String::as_str).collect::<Vec<_>>(),
        ["get"]
    );
    assert!(!paths.keys().any(|path| path.starts_with("/api/v1/typing/")));

    let response = &typing["get"]["responses"]["200"]["content"]["application/json"]["schema"];
    assert_eq!(response["type"], "array");
    assert_eq!(response["items"]["type"], "object");
    assert_eq!(
        response["items"]["properties"],
        serde_json::json!({ "id": { "type": "string" }, "text": { "type": "string" } })
    );
    assert_eq!(
        response["items"]["required"],
        serde_json::json!(["id", "text"])
    );
    assert_eq!(
        json["components"]["schemas"]["TypingResponse"],
        response["items"]
    );
}
