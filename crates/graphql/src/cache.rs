static STAGE_NAME: tokio::sync::OnceCell<String> = tokio::sync::OnceCell::const_new();

/// Fetches the STAGE_NAME from cache or initializes it from environment variables if not already loaded.
pub async fn get_or_init_stage_name() -> Result<&'static String, crate::error::Error> {
    STAGE_NAME
        .get_or_try_init(|| async {
            let stage_name = std::env::var("STAGE_NAME").unwrap();

            tracing::debug!("STAGE_NAME: {}", stage_name);

            Ok(stage_name)
        })
        .await
}
