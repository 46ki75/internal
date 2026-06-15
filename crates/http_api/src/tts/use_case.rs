use std::sync::Arc;

pub struct TtsService {
    pub tts_repository: Arc<dyn super::repository::TtsRepository + Send + Sync>,
}

impl TtsService {
    pub fn infer(&self, buf: bytes::Bytes) -> Result<String, crate::error::Error> {
        let kind = infer::get(&buf).ok_or(crate::error::Error::InferUnknownType)?;
        Ok(kind.mime_type().to_owned())
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

        assert_eq!(service.infer(png).unwrap(), "image/png");
    }

    #[test]
    fn infer_unknown_bytes_is_error() {
        let service = TtsService {
            tts_repository: Arc::new(TtsRepositoryStub),
        };

        // Bytes with no recognizable magic number → `InferUnknownType`,
        // not a panic.
        let unknown = bytes::Bytes::from_static(b"not a known file type");

        assert!(matches!(
            service.infer(unknown),
            Err(crate::error::Error::InferUnknownType)
        ));
    }
}
