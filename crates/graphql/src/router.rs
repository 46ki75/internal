//! Initializes and returns axum router.

use utoipa::OpenApi;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct AxumAppState {
    pub bookmark_service: std::sync::Arc<crate::bookmark::service::BookmarkService>,
}

#[derive(OpenApi)]
#[openapi(info(
    title = "http-api",
    version = "1.0.0",
    description = "API description",
    contact(name = "Ikuma Yamashita", email = "me@ikuma.cloud"),
    license(name = "GPL-3.0")
))]
struct ApiDoc;

static ROUTER: tokio::sync::OnceCell<axum::Router> = tokio::sync::OnceCell::const_new();

/// Initializes and returns axum router.
pub async fn init_router() -> Result<&'static axum::Router, crate::error::Error> {
    ROUTER
        .get_or_try_init(|| async {
            let bookmark_repository =
                std::sync::Arc::new(crate::bookmark::repository::BookmarkRepositoryImpl {});
            let bookmark_service = std::sync::Arc::new(crate::bookmark::service::BookmarkService {
                bookmark_repository,
            });

            let app_state = std::sync::Arc::new(AxumAppState { bookmark_service });

            let (router, auto_generated_api) = OpenApiRouter::new()
                .routes(routes!(crate::bookmark::controller::bookmark_list))
                .with_state(app_state)
                .split_for_parts();

            let customized_api = ApiDoc::openapi().merge_from(auto_generated_api);

            let app = router
                .merge(
                    utoipa_swagger_ui::SwaggerUi::new("/api/v1/swagger-ui")
                        .url("/api/v1/openapi.json", customized_api),
                )
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
                .route(
                    "/api-gateway/api/graphql",
                    axum::routing::post(crate::graphql_handler::graphql_handler),
                )
                .layer(tower_http::compression::CompressionLayer::new());

            Ok(app)
        })
        .await
}
