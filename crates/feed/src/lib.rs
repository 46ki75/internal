pub mod error;
pub mod repository;
pub mod use_case;

/// Boxed `Send + Sync` future — the dyn-compatible return shape shared by the
/// async methods on [`repository::Repository`] and [`use_case::UseCase`].
pub type BoxFuture<T> = std::pin::Pin<Box<dyn std::future::Future<Output = T> + Send + Sync>>;
