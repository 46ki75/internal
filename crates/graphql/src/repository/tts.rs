use http::header::CONTENT_TYPE;
use serde::Deserialize;

pub trait TtsRepository {
    fn text_to_speach(
        text: &str,
    ) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<bytes::Bytes, crate::error::Error>> + Send>,
    >;
}

pub struct TtsRepositoryImpl {}

impl TtsRepository for TtsRepositoryImpl {
    fn text_to_speach(
        text: &str,
    ) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<bytes::Bytes, crate::error::Error>> + Send>,
    > {
        let text = text.to_owned();

        Box::pin(async move {
            let secret = crate::cache::get_or_init_finevoice_api_key().await?;

            let body_value = serde_json::json!({
                "voice": "neuro-sama",
                "speech": text,
                "noCdn": true
            });

            let client = crate::cache::get_or_init_reqwest_client().await?;

            let request = client
                .post("https://ttsapi.fineshare.com/v1/text-to-speech")
                .header(CONTENT_TYPE, "application/json")
                .header("x-api-key", secret)
                .body(body_value.to_string());

            let response = request.send().await.unwrap().bytes().await.unwrap();

            #[derive(Deserialize)]
            struct Response {
                download_url: String,
            }

            let Response { download_url } = serde_json::from_slice(&response)?;

            let voice = client
                .get(download_url)
                .send()
                .await
                .unwrap()
                .bytes()
                .await
                .unwrap();

            Ok(voice)
        })
    }
}
