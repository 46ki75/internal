use super::{entity::IconEntiry, repository::IconRepository};

pub struct IconService {
    pub icon_repository: std::sync::Arc<dyn IconRepository + Send + Sync>,
}

impl IconService {
    pub async fn list_icons(&self) -> Result<Vec<IconEntiry>, crate::error::Error> {
        let icons = self.icon_repository.list_icons().await?;

        let icon_list = icons
            .into_iter()
            .map(|icon| IconEntiry {
                id: icon.id,
                url: icon.url,
            })
            .collect::<Vec<IconEntiry>>();

        Ok(icon_list)
    }
}
