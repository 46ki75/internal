#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Environmental variable not found: {0}")]
    EnvironmentalVariableNotFound(String),

    #[error("Invalid timezone")]
    InvalidTimezone,

    #[error("Invalid Datetime(RFC3339) Format {0}")]
    DateTimeParse(#[from] chrono::ParseError),

    #[error("notionrs error: {0}")]
    NotionRs(#[from] notionrs::error::Error),

    #[error("elmethis_notion error: {0}")]
    ElmethisNotion(#[from] elmethis_notion::error::Error),

    #[error("serde error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("Notion property not found: {0}")]
    NotionPropertynotFound(String),
}
