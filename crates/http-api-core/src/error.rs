#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("SSM Parameter error: {0}")]
    SsmParameter(String),

    #[error("Notion property not found: {0}")]
    NotionPropertyNotFound(String),

    #[error("serde error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("HTTP request error: {0}")]
    Reqwest(#[from] reqwest::Error),

    // Boxed: this AWS `SdkError` is ~360 bytes and would otherwise dominate the
    // size of `Error` — and of every enum that wraps it via `#[from]`.
    #[error("SSM SDK error: {0}")]
    SsmSdkError(
        Box<aws_sdk_ssm::error::SdkError<aws_sdk_ssm::operation::get_parameter::GetParameterError>>,
    ),
}

impl From<aws_sdk_ssm::error::SdkError<aws_sdk_ssm::operation::get_parameter::GetParameterError>>
    for Error
{
    fn from(
        value: aws_sdk_ssm::error::SdkError<
            aws_sdk_ssm::operation::get_parameter::GetParameterError,
        >,
    ) -> Self {
        Error::SsmSdkError(Box::new(value))
    }
}

/// Renders a controller error as the crate's standard JSON error response:
/// logs it at `error` level and returns `{ "error": <Display> }` with the
/// given status. Every feature's `IntoResponse` impl delegates here so the
/// log line and body shape stay identical in one place; the per-controller
/// `status` decision stays local to each error type.
pub fn render_error_response<E>(status: http::StatusCode, error: &E) -> axum::response::Response
where
    E: std::fmt::Display + std::fmt::Debug,
{
    use axum::response::IntoResponse;

    tracing::error!(error = ?error, "request failed");
    let body = serde_json::json!({ "error": error.to_string() });
    (status, axum::Json(body)).into_response()
}
