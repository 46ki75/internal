//! Initializes and returns axum router.

use axum::Router;
use utoipa::OpenApi;
use utoipa_scalar::{Scalar, Servable};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "http-api",
        version = "1.0.0",
        description = "API description",
        contact(name = "Ikuma Yamashita", email = "me@ikuma.cloud"),
        license(name = "GPL-3.0")
    ),
    servers((url = "/api-gateway", description = "API Gateway base path"))
)]
struct ApiDoc;

static ROUTER: tokio::sync::OnceCell<axum::Router> = tokio::sync::OnceCell::const_new();

/// Initializes and returns axum router.
pub async fn init_router() -> Result<&'static axum::Router, crate::error::Error> {
    ROUTER
        .get_or_try_init(|| async {
            let (typing_router, typing_api) =
                crate::typing::controller::router::init_typing_router().await?;
            let (writing_assessment_router, writing_assessment_api) =
                crate::writing_assessment::controller::router::init_writing_assessment_router()
                    .await?;

            let rust_api = ApiDoc::openapi()
                .merge_from(typing_api)
                .merge_from(writing_assessment_api);
            let merged_api = compose_openapi(serde_json::to_value(rust_api)?)?;

            let combined_router = typing_router.merge(writing_assessment_router);

            let scalar_api = merged_api.clone();
            let app = Router::new()
                .nest("/api-gateway", combined_router)
                .route(
                    "/api-gateway/api/v1/openapi.json",
                    axum::routing::get(move || {
                        let openapi = merged_api.clone();
                        async move { axum::Json(openapi) }
                    }),
                )
                .merge(Scalar::with_url("/api-gateway/api/v1/scalar", scalar_api))
                .route(
                    "/api-gateway/api/health",
                    axum::routing::get(|| async {
                        #[derive(serde::Serialize)]
                        struct Status {
                            status: String,
                        }

                        axum::Json(Status {
                            status: "ok".to_string(),
                        })
                    }),
                )
                .layer(tower_http::compression::CompressionLayer::new());

            Ok(app)
        })
        .await
}

fn compose_openapi(mut rust: serde_json::Value) -> Result<serde_json::Value, crate::error::Error> {
    // Preserve Nitro's JSON Schema verbatim: Utoipa's schema types do not accept
    // every construct emitted by Zod. Scalar can serve the composed JSON directly.
    let notion: serde_json::Value =
        serde_json::from_str(include_str!("../../../packages/http-api/openapi.json"))?;
    merge_unique(&mut rust["paths"], &notion["paths"])?;
    if rust["components"].is_null() {
        rust["components"] = serde_json::json!({});
    }
    if let Some(components) = notion["components"].as_object() {
        for (kind, entries) in components {
            merge_unique(&mut rust["components"][kind], entries)?;
        }
    }
    Ok(rust)
}

fn merge_unique(
    target: &mut serde_json::Value,
    source: &serde_json::Value,
) -> Result<(), crate::error::Error> {
    if target.is_null() {
        *target = serde_json::json!({});
    }
    let target = target
        .as_object_mut()
        .ok_or_else(|| crate::error::Error::OpenApiConflict("expected an object".into()))?;
    if let Some(source) = source.as_object() {
        for (name, value) in source {
            if target.insert(name.clone(), value.clone()).is_some() {
                return Err(crate::error::Error::OpenApiConflict(name.clone()));
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn composition_rejects_duplicate_paths_and_schemas() {
        let combined = compose_openapi(serde_json::to_value(ApiDoc::openapi()).unwrap()).unwrap();
        assert!(combined["paths"].get("/api/v1/trivia").is_some());
        assert_eq!(
            combined["components"]["schemas"]["AnkiResponse"]["properties"]["title"]["type"],
            serde_json::json!(["string", "null"])
        );
        assert!(compose_openapi(combined.clone()).is_err());
        let mut schemas_only = combined;
        schemas_only["paths"] = serde_json::json!({});
        assert!(compose_openapi(schemas_only).is_err());
    }
}
