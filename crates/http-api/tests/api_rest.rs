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

// ---- anki ----

fn anki_test_router() -> axum::Router {
    let state = Arc::new(http_api::anki::controller::router::AnkiState {
        anki_use_case: Arc::new(http_api::anki::use_case::AnkiUseCase {
            anki_repository: Arc::new(http_api::anki::repository::AnkiRepositoryStub),
        }),
    });
    http_api::anki::controller::router::anki_router(state).0
}

#[tokio::test]
async fn anki_get_returns_stub_card() {
    let (status, json) = get_json(anki_test_router(), "/api/v1/anki/any-id").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["page_id"], "4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e");
    assert_eq!(json["ease_factor"], 2.5);
}

// ---- bookmark ----

fn bookmark_test_router() -> axum::Router {
    let state = Arc::new(http_api::bookmark::controller::router::BookmarkState {
        bookmark_use_case: Arc::new(http_api::bookmark::use_case::BookmarkUseCase {
            bookmark_repository: Arc::new(http_api::bookmark::repository::BookmarkRepositoryStub),
        }),
    });
    http_api::bookmark::controller::router::bookmark_router(state).0
}

#[tokio::test]
async fn bookmark_list_returns_stub_row() {
    let (status, json) = get_json(bookmark_test_router(), "/api/v1/bookmark").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json[0]["name"], "三菱UFJダイレクト");
}

// ---- icon ----

fn icon_test_router() -> axum::Router {
    let state = Arc::new(http_api::icon::controller::router::IconState {
        icon_use_case: Arc::new(http_api::icon::use_case::IconUseCase {
            icon_repository: Arc::new(http_api::icon::repository::IconRepositoryStub),
        }),
    });
    http_api::icon::controller::router::icon_router(state).0
}

#[tokio::test]
async fn icon_list_returns_stub_icons() {
    let (status, json) = get_json(icon_test_router(), "/api/v1/icon").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json.as_array().unwrap().len(), 2);
    assert_eq!(json[0]["id"], "icon-1");
    assert_eq!(json[0]["content_type"], "image/png");
}

// ---- image ----

fn image_test_router() -> axum::Router {
    let state = Arc::new(http_api::image::controller::router::ImageState {
        image_use_case: Arc::new(http_api::image::use_case::ImageUseCase {
            repository: Arc::new(http_api::image::repository::ImageRepositoryStub),
        }),
    });
    http_api::image::controller::router::image_router(state).0
}

#[tokio::test]
async fn image_fetch_returns_stub_image() {
    let (status, json) = get_json(image_test_router(), "/api/v1/image").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["images"][0]["title"], "alpha");
}

#[tokio::test]
async fn image_tags_returns_stub_tag() {
    let (status, json) = get_json(image_test_router(), "/api/v1/image/tag").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json[0]["tag_name"], "artist-tag");
}

// ---- to_do ----

fn to_do_test_router() -> axum::Router {
    let state = Arc::new(http_api::to_do::controller::router::ToDoState {
        to_do_use_case: Arc::new(http_api::to_do::use_case::ToDoUseCase {
            to_do_repository: Arc::new(http_api::to_do::repository::ToDoRepositoryStub),
        }),
    });
    http_api::to_do::controller::router::to_do_router(state).0
}

#[tokio::test]
async fn to_do_list_returns_array() {
    let (status, json) = get_json(to_do_test_router(), "/api/v1/to-do").await;

    assert_eq!(status, StatusCode::OK);
    let rows = json.as_array().unwrap();
    assert!(!rows.is_empty());
    assert!(rows[0]["title"].is_string());
}

// ---- trivia ----

fn trivia_test_router() -> axum::Router {
    let state = Arc::new(http_api::trivia::controller::router::TriviaState {
        trivia_use_case: Arc::new(http_api::trivia::use_case::TriviaUseCase {
            trivia_repository: Arc::new(http_api::trivia::repository::TriviaRepositoryStub),
        }),
    });
    http_api::trivia::controller::router::trivia_router(state).0
}

#[tokio::test]
async fn trivia_list_returns_array() {
    let (status, json) = get_json(trivia_test_router(), "/api/v1/trivia").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn trivia_block_list_normalizes_root() {
    let (status, json) = get_json(trivia_test_router(), "/api/v1/trivia/block/any-id").await;

    assert_eq!(status, StatusCode::OK);
    // The renderer resolves the root by the hardcoded id "root".
    assert_eq!(json["surface"]["root"], "root");
}

// ---- typing ----

fn typing_test_router() -> axum::Router {
    let state = Arc::new(http_api::typing::controller::router::TypingState {
        typing_use_case: Arc::new(http_api::typing::use_case::TypingUseCase {
            typing_repository: Arc::new(http_api::typing::repository::TypingRepositoryStub),
        }),
    });
    http_api::typing::controller::router::typing_router(state).0
}

#[tokio::test]
async fn typing_list_returns_stub_rows() {
    let (status, json) = get_json(typing_test_router(), "/api/v1/typing").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(json.as_array().unwrap().len(), 2);
    assert_eq!(json[0]["id"], "93165a44-43c8-4790-84ad-08de54ec549a");
}

#[tokio::test]
async fn typing_upsert_returns_ok() {
    let response = typing_test_router()
        .oneshot(
            Request::post("/api/v1/typing")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"text":"hello","description":"d"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["id"], "680008c4-d898-4202-8102-137cd9256595");
}

#[tokio::test]
async fn typing_unknown_path_is_404() {
    let (status, _) = get_json(typing_test_router(), "/api/v1/nope").await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

// ---- writing assessment ----

use http_api::writing_assessment::{
    repository::{AssessmentGenerator, AssessmentPersistence, GeneratorError, PersistenceError},
    use_case::{
        WritingAssessmentUseCase,
        domain::{
            Assessment, AssessmentLabel, FeedbackLayer, FeedbackType, GeneratedAssessment,
            GeneratedFeedback, Severity,
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
    ) -> Result<(GeneratedAssessment, String), GeneratorError> {
        Ok((
            GeneratedAssessment {
                score: 4,
                label: AssessmentLabel::NearNative,
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
            "test/model".into(),
        ))
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
        created_at: "2026-07-21T00:00:00Z".into(),
        schema_version: 1,
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
