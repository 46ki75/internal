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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tts::repository::TtsRepositoryStub;

    #[tokio::test]
    async fn text_to_speach_passes_bytes_through() {
        let service = TtsService {
            tts_repository: Arc::new(TtsRepositoryStub),
        };

        let bytes = service.text_to_speach("hello").await.unwrap();

        assert_eq!(bytes.as_ref(), b"stub-audio-bytes");
    }

    #[test]
    fn infer_detects_png_magic() {
        let service = TtsService {
            tts_repository: Arc::new(TtsRepositoryStub),
        };

        // 8-byte PNG signature — enough for `infer` to classify the bytes.
        let png = bytes::Bytes::from_static(b"\x89PNG\r\n\x1a\n");

        assert_eq!(service.infer(png), "image/png");
    }
}
