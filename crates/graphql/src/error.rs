#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Environmental variable not found: {0}")]
    EnvironmentalVariableNotFound(String),

    #[error("SSM Parameter error: {0}")]
    SsmFetchParameter(String),

    #[error("Invalid timezone")]
    InvalidTimezone,

    #[error("Invalid Datetime(RFC3339) Format {0}")]
    DateTimeParse(#[from] time::error::Parse),

    #[error("notionrs error: {0}")]
    NotionRs(String),

    #[error("elmethis_notion error: {0}")]
    ElmethisNotion(#[from] notion_to_jarkup::error::Error),

    #[error("serde error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("Notion property not found: {0}")]
    NotionPropertynotFound(String),

    #[error("URL parse error: {0}")]
    UrlParse(#[from] url::ParseError),

    #[error("FQDN parse error: {0}")]
    FqdnParse(String),

    #[error("DynamoDB error: {0}")]
    DynamoDb(String),

    #[error("No items found: {0}")]
    DynamoDbNoItems(String),

    #[error("DynamoDB Type error: {0}")]
    DynamoDbType(String),
}
