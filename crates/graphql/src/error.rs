#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("SSM Parameter error: {0}")]
    SsmParameter(String),

    #[error("Notion property not found: {0}")]
    NotionPropertyNotFound(String),

    #[error("serde error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("SSM SDK error: {0}")]
    SsmSdkError(
        #[from]
        aws_sdk_ssm::error::SdkError<aws_sdk_ssm::operation::get_parameter::GetParameterError>,
    ),
}
