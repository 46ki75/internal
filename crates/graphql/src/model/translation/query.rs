#[derive(Default)]
pub struct TranslationQuery;

#[derive(async_graphql::InputObject, serde::Serialize)]
pub struct TranslateInput {
    pub text: String,
    pub source_lang: Language,
    pub target_lang: Language,
}

#[derive(serde::Serialize)]
pub struct TranslateRequest {
    pub text: Vec<String>,
    pub source_lang: Language,
    pub target_lang: Language,
}

#[derive(serde::Deserialize)]
pub struct TranslateResponse {
    pub translations: Vec<TranslateResponseParams>,
}

#[derive(serde::Deserialize)]
pub struct TranslateResponseParams {
    pub text: String,
}

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq, serde::Serialize)]
pub enum Language {
    #[graphql(name = "EN-US")]
    #[serde(rename = "EN-US")]
    EnglishUnitedStates,

    #[graphql(name = "JA")]
    #[serde(rename = "JA")]
    Japanese,
}

#[async_graphql::Object]
impl TranslationQuery {
    pub async fn translate(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: TranslateInput,
    ) -> Result<String, async_graphql::Error> {
        let secret = std::env::var("DEEPL_API_KEY")?;

        let client = reqwest::Client::new();

        let body_string = serde_json::to_string(&TranslateRequest {
            text: vec![input.text],
            source_lang: input.source_lang,
            target_lang: input.target_lang,
        })?;
        let body_bytes = body_string.as_bytes();
        let content_length = body_bytes.len();

        let request = client
            .post("https://api-free.deepl.com/v2/translate")
            .header("Authorization", format!("DeepL-Auth-Key {secret}"))
            .header("Content-Type", "application/json")
            .header("Content-Length", content_length)
            .body(body_string);

        let response = request.send().await?;

        let response_body = response.text().await?;

        let response = serde_json::from_str::<TranslateResponse>(&response_body)?;

        let result = response
            .translations
            .first()
            .ok_or("Translation Result Not Found")?
            .text
            .clone();

        Ok(result)
    }
}
