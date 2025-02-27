#[derive(Debug, Clone)]
pub struct Config {
    pub environment: String,
    pub notion_api_key: String,
    pub notion_anki_database_id: String,
    pub notion_to_do_database_id: String,
    pub notion_bookmark_database_id: String,
}

impl Config {
    pub fn try_new() -> Result<Self, crate::error::Error> {
        let environment = std::env::var("ENVIRONMENT").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound("ENVIRONMENT".to_string())
        })?;

        dotenvy::dotenv().ok();

        let notion_api_key = std::env::var("NOTION_API_KEY").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound("NOTION_API_KEY".to_string())
        })?;

        let notion_anki_database_id = std::env::var("NOTION_ANKI_DATABASE_ID").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound(
                "NOTION_ANKI_DATABASE_ID".to_string(),
            )
        })?;

        let notion_to_do_database_id = std::env::var("NOTION_TO_DO_DATABASE_ID").map_err(|_| {
            crate::error::Error::EnvironmentalVariableNotFound(
                "NOTION_TO_DO_DATABASE_ID".to_string(),
            )
        })?;

        let notion_bookmark_database_id =
            std::env::var("NOTION_BOOKMARK_DATABASE_ID").map_err(|_| {
                crate::error::Error::EnvironmentalVariableNotFound(
                    "NOTION_BOOKMARK_DATABASE_ID".to_string(),
                )
            })?;

        Ok(Config {
            environment,
            notion_api_key,
            notion_anki_database_id,
            notion_to_do_database_id,
            notion_bookmark_database_id,
        })
    }
}
