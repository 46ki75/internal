pub mod input;
pub mod output;

use crate::icon::repository::IconRepository;
use futures::future::join_all;
use http::header::CONTENT_TYPE;
use output::IconEntiry;

pub struct IconUseCase {
    pub icon_repository: std::sync::Arc<dyn IconRepository + Send + Sync>,
}

impl IconUseCase {
    pub async fn list_icons(&self) -> Result<Vec<IconEntiry>, crate::error::Error> {
        let icons: Vec<crate::icon::repository::output::IconDto> =
            self.icon_repository.list_icons().await?;

        let icon_list = join_all(icons.into_iter().map(|icon| async move {
            let client = crate::cache::get_or_init_reqwest_client().await?;

            let mime_type = client.head(&icon.url).send().await.ok().and_then(|res| {
                res.headers()
                    .get(CONTENT_TYPE)
                    .and_then(|c| c.to_str().ok().map(|s| s.to_string()))
            });

            Ok::<IconEntiry, crate::error::Error>(IconEntiry {
                id: icon.id,
                url: icon.url,
                name: icon.name,
                content_type: mime_type,
            })
        }))
        .await
        .into_iter()
        .collect::<Result<Vec<IconEntiry>, crate::error::Error>>()?;

        Ok(icon_list)
    }
}
