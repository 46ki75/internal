use async_graphql::{EmptySubscription, Schema};

static SCHEMA: tokio::sync::OnceCell<
    Schema<crate::query::QueryRoot, crate::mutation::MutationRoot, EmptySubscription>,
> = tokio::sync::OnceCell::const_new();

pub async fn try_init_schema() -> Result<
    &'static Schema<crate::query::QueryRoot, crate::mutation::MutationRoot, EmptySubscription>,
    crate::error::Error,
> {
    SCHEMA
        .get_or_try_init(async || {
            tracing::info!("Initializing schema");

            tracing::debug!("Injecting dependencies: Anki");
            let anki_repository =
                std::sync::Arc::new(crate::repository::anki::AnkiRepositoryImpl {});
            let anki_service =
                std::sync::Arc::new(crate::service::anki::AnkiService { anki_repository });

            tracing::debug!("Injecting dependencies: Bookmark");
            let bookmark_repository =
                std::sync::Arc::new(crate::repository::bookmark::BookmarkRepositoryImpl {});
            let bookmark_service = std::sync::Arc::new(crate::service::bookmark::BookmarkService {
                bookmark_repository,
            });

            tracing::debug!("Injecting dependencies: ToDO");
            let to_do_repository =
                std::sync::Arc::new(crate::repository::to_do::ToDoRepositoryImpl {});
            let to_do_service =
                std::sync::Arc::new(crate::service::to_do::ToDoService { to_do_repository });

            tracing::debug!("Injecting dependencies: Typing");
            let typing_repository: std::sync::Arc<crate::repository::typing::TypingRepositoryImpl> =
                std::sync::Arc::new(crate::repository::typing::TypingRepositoryImpl {});
            let typing_service =
                std::sync::Arc::new(crate::service::typing::TypingService { typing_repository });

            tracing::debug!("Building schema: QueryRoot");
            let query_root = crate::query::QueryRoot::default();

            tracing::debug!("Building schema: MutationRoot");
            let mutation_root = crate::mutation::MutationRoot::default();

            tracing::debug!("Building schema: Schema");
            Ok(Schema::build(query_root, mutation_root, EmptySubscription)
                .data(anki_service)
                .data(bookmark_service)
                .data(to_do_service)
                .data(typing_service)
                .finish())
        })
        .await
}
