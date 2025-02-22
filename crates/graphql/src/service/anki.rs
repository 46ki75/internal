pub struct AnkiService<T>
where
    T: crate::repository::anki::AnkiRepository,
{
    anki_repository: T,
}

impl<T> AnkiService<T>
where
    T: crate::repository::anki::AnkiRepository,
{
    pub async fn list_blocks(
        &self,
        id: &str,
    ) -> Result<crate::model::anki::AnkiBlock, crate::error::Error> {
        let blocks = self.anki_repository.list_blocks_by_id(id).await?;

        let mut front: Vec<elmethis_notion::block::Block> = Vec::new();
        let mut back: Vec<elmethis_notion::block::Block> = Vec::new();
        let mut explanation: Vec<elmethis_notion::block::Block> = Vec::new();

        enum Marker {
            Front,
            Back,
            Explanation,
        }

        let mut marker = Marker::Front;

        for block in blocks {
            if let elmethis_notion::block::Block::ElmHeading1(
                elmethis_notion::block::ElmHeading1 { props },
            ) = &block
            {
                if props.text == "front" {
                    marker = Marker::Front;
                    continue;
                } else if props.text == "back" {
                    marker = Marker::Back;
                    continue;
                } else if props.text == "explanation" {
                    marker = Marker::Explanation;
                    continue;
                }
            }

            match marker {
                Marker::Front => front.push(block),
                Marker::Back => back.push(block),
                Marker::Explanation => explanation.push(block),
            }
        }

        Ok(crate::model::anki::AnkiBlock {
            front: serde_json::to_value(front)?,
            back: serde_json::to_value(back)?,
            explanation: serde_json::to_value(explanation)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::anki::AnkiRepositoryStab;

    #[tokio::test]
    async fn separate_blocks() {
        let anki_repository_stab = AnkiRepositoryStab;
        let anki_service = AnkiService {
            anki_repository: anki_repository_stab,
        };

        let _ = anki_service
            .list_blocks("28b8e5f3-ba43-44a8-b790-bfc8c62b7628")
            .await
            .unwrap();
    }
}
