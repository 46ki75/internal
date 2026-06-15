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

    #[error("could not infer file type from bytes")]
    InferUnknownType,

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
