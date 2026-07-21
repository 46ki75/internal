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
            let (anki_router, anki_api) =
                crate::anki::controller::router::init_anki_router().await?;
            let (bookmark_router, bookmark_api) =
                crate::bookmark::controller::router::init_bookmark_router().await?;
            let (icon_router, icon_api) =
                crate::icon::controller::router::init_icon_router().await?;
            let (image_router, image_api) =
                crate::image::controller::router::init_image_router().await?;
            let (to_do_router, to_do_api) =
                crate::to_do::controller::router::init_to_do_router().await?;
            let (trivia_router, trivia_api) =
                crate::trivia::controller::router::init_trivia_router().await?;
            let (typing_router, typing_api) =
                crate::typing::controller::router::init_typing_router().await?;
            let (writing_assessment_router, writing_assessment_api) =
                crate::writing_assessment::controller::router::init_writing_assessment_router()
                    .await?;

            let merged_api = ApiDoc::openapi()
                .merge_from(anki_api)
                .merge_from(bookmark_api)
                .merge_from(icon_api)
                .merge_from(image_api)
                .merge_from(to_do_api)
                .merge_from(trivia_api)
                .merge_from(typing_api)
                .merge_from(writing_assessment_api);

            let combined_router = anki_router
                .merge(bookmark_router)
                .merge(icon_router)
                .merge(image_router)
                .merge(to_do_router)
                .merge(trivia_router)
                .merge(typing_router)
                .merge(writing_assessment_router);

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
