//! Initializes and returns axum router.

static ROUTER: tokio::sync::OnceCell<axum::Router> = tokio::sync::OnceCell::const_new();

/// Initializes and returns axum router.
pub async fn init_router() -> Result<&'static axum::Router, crate::error::Error> {
    ROUTER
        .get_or_try_init(|| async {
            let app = axum::Router::new()
                .route(
                    "/api/health",
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
                    "/api/graphql",
                    axum::routing::post(crate::graphql_handler::graphql_handler),
                );

            Ok(app)
        })
        .await
}
