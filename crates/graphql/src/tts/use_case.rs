use std::sync::Arc;

pub struct TtsService {
    pub tts_repository: Arc<dyn super::repository::TtsRepository + Send + Sync>,
}

impl TtsService {
    pub fn infer(&self, buf: bytes::Bytes) -> String {
        let kind = infer::get(&buf).expect("file type is known");
        kind.mime_type().to_owned()
    }

    pub async fn text_to_speach(&self, text: &str) -> Result<bytes::Bytes, crate::error::Error> {
        let bytes = self.tts_repository.text_to_speach(text).await?;

        Ok(bytes)
    }
}
