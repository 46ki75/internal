//! Initializes and returns axum router.

use std::sync::Arc;

use utoipa::OpenApi;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
pub struct AxumAppState {
    pub bookmark_service: Arc<crate::bookmark::service::BookmarkService>,
    pub to_do_service: Arc<crate::to_do::service::ToDoService>,
    pub anki_service: Arc<crate::anki::service::AnkiService>,
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
                Arc::new(crate::bookmark::repository::BookmarkRepositoryImpl {});
            let bookmark_service = Arc::new(crate::bookmark::service::BookmarkService {
                bookmark_repository,
            });

            let to_do_repository = Arc::new(crate::to_do::repository::ToDoRepositoryImpl {});
            let to_do_service = Arc::new(crate::to_do::service::ToDoService { to_do_repository });

            let anki_repository = Arc::new(crate::anki::repository::AnkiRepositoryImpl {});
            let anki_service = Arc::new(crate::anki::service::AnkiService { anki_repository });

            let app_state = Arc::new(AxumAppState {
                bookmark_service,
                to_do_service,
                anki_service,
            });

            let (router, auto_generated_api) = OpenApiRouter::new()
                .routes(routes!(crate::bookmark::controller::bookmark_list))
                .routes(routes!(crate::bookmark::controller::create_bookmark))
                .routes(routes!(crate::to_do::controller::to_do_list))
                .routes(routes!(crate::to_do::controller::create_to_do))
                .routes(routes!(crate::to_do::controller::update_to_do))
                .routes(routes!(crate::anki::controller::anki))
                .routes(routes!(crate::anki::controller::anki_list))
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
