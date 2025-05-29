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

            let config = std::sync::Arc::new(crate::config::Config::try_new_async().await?);

            tracing::debug!("Injecting dependencies: Anki");
            let anki_repository =
                std::sync::Arc::new(crate::repository::anki::AnkiRepositoryImpl {
                    config: config.clone(),
                });
            let anki_service =
                std::sync::Arc::new(crate::service::anki::AnkiService { anki_repository });
            let anki_query_resolver =
                std::sync::Arc::new(crate::resolver::anki::query::AnkiQueryResolver);
            let anki_mutation_resolver =
                std::sync::Arc::new(crate::resolver::anki::mutation::AnkiMutationResolver);

            tracing::debug!("Injecting dependencies: Bookmark");
            let bookmark_repository =
                std::sync::Arc::new(crate::repository::bookmark::BookmarkRepositoryImpl {
                    config: config.clone(),
                });
            let bookmark_service = std::sync::Arc::new(crate::service::bookmark::BookmarkService {
                bookmark_repository,
            });
            let bookmark_query_resolver =
                std::sync::Arc::new(crate::resolver::bookmark::query::BookmarkQueryResolver);
            let bookmark_mutation_resolver =
                std::sync::Arc::new(crate::resolver::bookmark::mutation::BookmarkMutationResolver);

            tracing::debug!("Injecting dependencies: ToDO");
            let to_do_repository =
                std::sync::Arc::new(crate::repository::to_do::ToDoRepositoryImpl {
                    config: config.clone(),
                });
            let to_do_service =
                std::sync::Arc::new(crate::service::to_do::ToDoService { to_do_repository });
            let to_do_query_resolver =
                std::sync::Arc::new(crate::resolver::to_do::query::ToDoQueryResolver);
            let to_do_mutation_resolver =
                std::sync::Arc::new(crate::resolver::to_do::mutation::ToDoMutationResolver);

            tracing::debug!("Injecting dependencies: Typing");
            let typing_repository: std::sync::Arc<crate::repository::typing::TypingRepositoryImpl> =
                std::sync::Arc::new(crate::repository::typing::TypingRepositoryImpl {
                    config: config.clone(),
                });
            let typing_service =
                std::sync::Arc::new(crate::service::typing::TypingService { typing_repository });
            let typing_query_resolver =
                std::sync::Arc::new(crate::resolver::typing::query::TypingQueryResolver);
            let typing_mutation_resolver =
                std::sync::Arc::new(crate::resolver::typing::mutation::TypingMutationResolver);

            tracing::debug!("Building schema: QueryRoot");
            let query_root = crate::query::QueryRoot {
                anki_query_resolver,
                bookmark_query_resolver,
                to_do_query_resolver,
                typing_query_resolver,
            };

            tracing::debug!("Building schema: MutationRoot");
            let mutation_root = crate::mutation::MutationRoot {
                anki_mutation_resolver,
                bookmark_mutation_resolver,
                to_do_mutation_resolver,
                typing_mutation_resolver,
            };

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
