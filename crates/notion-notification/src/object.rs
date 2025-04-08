use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub(crate) enum Severity {
    #[default]
    Info,
    Warn,
    Error,
}

#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub(crate) enum Status {
    #[default]
    New,
    Open,
    Suppressed,
    Resolved,
}
