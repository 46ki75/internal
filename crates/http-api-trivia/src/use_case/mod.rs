pub mod input;
pub mod output;

use crate::repository::{TriviaRepository, TriviaRepositoryError};
use output::*;

#[derive(Debug, thiserror::Error)]
pub enum TriviaUseCaseError {
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("repository error: {0}")]
    Repository(#[from] TriviaRepositoryError),
    #[error("internal error: {0}")]
    Internal(#[from] http_api_core::error::Error),
}

pub struct TriviaUseCase {
    pub trivia_repository: std::sync::Arc<dyn TriviaRepository + Send + Sync>,
}

// The renderer (`@elmethis/solid`'s `ElmA2ui`) resolves the root via the
// hardcoded id "root", so the page's root Column must use that exact id
// rather than the UUID Notion assigns.
const SECTION_ROOT_ID: &str = "root";

fn normalize_root(source: n2a2ui_a2ui::v0_9::Surface) -> n2a2ui_a2ui::v0_9::Surface {
    use n2a2ui_a2ui::v0_9::{ChildList, Column, Component, Surface};

    let root_children: Vec<String> = match source.components.get(&source.root) {
        Some(Component::Column(column)) => match &column.children {
            ChildList::Static(ids) => ids.clone(),
            ChildList::Template(_) => Vec::new(),
        },
        _ => Vec::new(),
    };

    let root_column = Column {
        id: SECTION_ROOT_ID.to_string(),
        children: ChildList::Static(root_children),
        ..Default::default()
    };

    let mut components = source.components.clone();
    components.shift_remove(&source.root);
    components.insert(SECTION_ROOT_ID.to_string(), Component::Column(root_column));

    Surface {
        root: SECTION_ROOT_ID.to_string(),
        components,
    }
}

impl TriviaUseCase {
    /// Returns up to `page_size` least-viewed trivia pages, shuffled so the
    /// feed stays fresh on every load.
    pub async fn list_trivia(
        &self,
        page_size: u32,
    ) -> Result<Vec<TriviaEntity>, TriviaUseCaseError> {
        let pages = self.trivia_repository.list_trivia(page_size).await?;

        let mut trivia_list = pages
            .results
            .into_iter()
            .map(|page| page.try_into())
            .collect::<Result<Vec<TriviaEntity>, http_api_core::error::Error>>()?;

        {
            use rand::seq::SliceRandom;
            let mut rng = rand::rng();
            trivia_list.shuffle(&mut rng);
        }

        Ok(trivia_list)
    }

    pub async fn list_blocks(&self, id: &str) -> Result<TriviaBlockEntity, TriviaUseCaseError> {
        let surface = self.trivia_repository.list_blocks_by_id(id).await?;

        let surface = normalize_root(surface);

        Ok(TriviaBlockEntity {
            surface: serde_json::to_value(surface)?,
        })
    }

    /// Increments the page's `view_count` by one (read-modify-write; safe for a
    /// single-user system).
    pub async fn increment_view(&self, id: &str) -> Result<TriviaEntity, TriviaUseCaseError> {
        let page = self.trivia_repository.get_trivia_by_id(id).await?;

        let current: TriviaEntity = page.try_into()?;

        let page_response = self
            .trivia_repository
            .update_view_count(id, current.view_count + 1)
            .await?;

        let trivia = page_response.try_into()?;

        Ok(trivia)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::TriviaRepositoryStub;

    #[tokio::test]
    async fn list_trivia() {
        let trivia_repository = std::sync::Arc::new(TriviaRepositoryStub);
        let trivia_use_case = TriviaUseCase { trivia_repository };

        let result = trivia_use_case.list_trivia(100).await.unwrap();
        assert_eq!(result.len(), 1);
    }

    #[tokio::test]
    async fn increment_view() {
        let trivia_repository = std::sync::Arc::new(TriviaRepositoryStub);
        let trivia_use_case = TriviaUseCase { trivia_repository };

        let result = trivia_use_case
            .increment_view("4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e")
            .await
            .unwrap();
        // Stub starts at 3, increment -> 4.
        assert_eq!(result.view_count, 4);
    }

    #[tokio::test]
    async fn list_blocks() {
        let trivia_repository = std::sync::Arc::new(TriviaRepositoryStub);
        let trivia_use_case = TriviaUseCase { trivia_repository };

        let blocks = trivia_use_case
            .list_blocks("4a3720d5-fcdd-46f1-a7b8-51e168ac5e8e")
            .await
            .unwrap();

        assert_eq!(blocks.surface["root"], "root");
    }

    // ---- normalize_root (pure) ----

    use n2a2ui_a2ui::v0_9::{ChildList, Column, Component, Surface};

    fn column(id: &str, children: &[&str]) -> Component {
        Component::Column(Column {
            id: id.to_string(),
            children: ChildList::Static(children.iter().map(|s| s.to_string()).collect()),
            ..Default::default()
        })
    }

    #[test]
    fn normalize_root_rewrites_id_and_preserves_children() {
        let mut components = indexmap::IndexMap::new();
        components.insert("orig".to_string(), column("orig", &["a", "b"]));
        components.insert("a".to_string(), column("a", &[]));
        components.insert("b".to_string(), column("b", &[]));
        let source = Surface {
            root: "orig".to_string(),
            components,
        };

        let result = normalize_root(source);

        assert_eq!(result.root, SECTION_ROOT_ID);
        assert!(result.components.contains_key(SECTION_ROOT_ID));
        assert!(!result.components.contains_key("orig"));
        match result.components.get(SECTION_ROOT_ID) {
            Some(Component::Column(col)) => match &col.children {
                ChildList::Static(ids) => {
                    assert_eq!(ids, &vec!["a".to_string(), "b".to_string()])
                }
                _ => panic!("expected static children"),
            },
            _ => panic!("expected a Column at the root id"),
        }
        assert!(result.components.contains_key("a"));
        assert!(result.components.contains_key("b"));
    }

    #[test]
    fn normalize_root_non_column_root_yields_empty_children() {
        let mut components = indexmap::IndexMap::new();
        components.insert(
            "orig".to_string(),
            Component::RichText(n2a2ui_a2ui::v0_9::RichText {
                id: "orig".to_string(),
                ..Default::default()
            }),
        );
        let source = Surface {
            root: "orig".to_string(),
            components,
        };

        let result = normalize_root(source);

        match result.components.get(SECTION_ROOT_ID) {
            Some(Component::Column(col)) => match &col.children {
                ChildList::Static(ids) => assert!(ids.is_empty()),
                _ => panic!("expected static children"),
            },
            _ => panic!("expected a Column at the root id"),
        }
    }
}
