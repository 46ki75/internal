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
                std::sync::Arc::new(crate::anki::repository::AnkiRepositoryImpl {});
            let anki_service =
                std::sync::Arc::new(crate::anki::service::AnkiService { anki_repository });

            tracing::debug!("Injecting dependencies: Bookmark");
            let bookmark_repository =
                std::sync::Arc::new(crate::bookmark::repository::BookmarkRepositoryImpl {});
            let bookmark_service = std::sync::Arc::new(crate::bookmark::service::BookmarkService {
                bookmark_repository,
            });

            tracing::debug!("Injecting dependencies: ToDO");
            let to_do_repository =
                std::sync::Arc::new(crate::to_do::repository::ToDoRepositoryImpl {});
            let to_do_service =
                std::sync::Arc::new(crate::to_do::service::ToDoService { to_do_repository });

            tracing::debug!("Injecting dependencies: Typing");
            let typing_repository: std::sync::Arc<crate::typing::repository::TypingRepositoryImpl> =
                std::sync::Arc::new(crate::typing::repository::TypingRepositoryImpl {});
            let typing_service =
                std::sync::Arc::new(crate::typing::service::TypingService { typing_repository });

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
