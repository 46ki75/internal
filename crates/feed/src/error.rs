#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Failed to fetch HTML: {0}")]
    FetchHtmlError(String),
}
