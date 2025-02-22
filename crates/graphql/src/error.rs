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
}
