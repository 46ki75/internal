use async_graphql::{EmptySubscription, Schema};
use std::sync::Arc;

type ApiSchema = Schema<crate::query::QueryRoot, crate::mutation::MutationRoot, EmptySubscription>;

static SCHEMA: tokio::sync::OnceCell<ApiSchema> = tokio::sync::OnceCell::const_new();

/// Assembles the GraphQL schema from injected use_cases. Split out from
/// [`try_init_schema`] so tests can build a schema backed by stub repositories.
pub fn build_schema(
    anki_use_case: Arc<crate::anki::use_case::AnkiUseCase>,
    bookmark_use_case: Arc<crate::bookmark::use_case::BookmarkUseCase>,
    to_do_use_case: Arc<crate::to_do::use_case::ToDoUseCase>,
    typing_use_case: Arc<crate::typing::use_case::TypingUseCase>,
) -> ApiSchema {
    Schema::build(
        crate::query::QueryRoot::default(),
        crate::mutation::MutationRoot::default(),
        EmptySubscription,
    )
    .data(anki_use_case)
    .data(bookmark_use_case)
    .data(to_do_use_case)
    .data(typing_use_case)
    .finish()
}

pub async fn try_init_schema() -> Result<
    &'static Schema<crate::query::QueryRoot, crate::mutation::MutationRoot, EmptySubscription>,
    crate::error::Error,
> {
    SCHEMA
        .get_or_try_init(async || {
            tracing::info!("Initializing schema");

            tracing::debug!("Injecting dependencies: Anki");
            let anki_repository =
                std::sync::Arc::new(crate::anki::repository::AnkiRepositoryImpl {});
            let anki_use_case =
                std::sync::Arc::new(crate::anki::use_case::AnkiUseCase { anki_repository });

            tracing::debug!("Injecting dependencies: Bookmark");
            let bookmark_repository =
                std::sync::Arc::new(crate::bookmark::repository::BookmarkRepositoryImpl {});
            let bookmark_use_case =
                std::sync::Arc::new(crate::bookmark::use_case::BookmarkUseCase {
                    bookmark_repository,
                });

            tracing::debug!("Injecting dependencies: ToDo");
            let to_do_repository =
                std::sync::Arc::new(crate::to_do::repository::ToDoRepositoryImpl {});
            let to_do_use_case =
                std::sync::Arc::new(crate::to_do::use_case::ToDoUseCase { to_do_repository });

            tracing::debug!("Injecting dependencies: Typing");
            let typing_repository: std::sync::Arc<crate::typing::repository::TypingRepositoryImpl> =
                std::sync::Arc::new(crate::typing::repository::TypingRepositoryImpl {});
            let typing_use_case =
                std::sync::Arc::new(crate::typing::use_case::TypingUseCase { typing_repository });

            tracing::debug!("Building schema: Schema");
            Ok(build_schema(
                anki_use_case,
                bookmark_use_case,
                to_do_use_case,
                typing_use_case,
            ))
        })
        .await
}
