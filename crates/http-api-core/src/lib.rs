//! Shared infrastructure for the `http-api` Lambda and its per-feature crates:
//! the crate-wide [`error::Error`] type, cached AWS/Notion clients and SSM
//! lookups in [`cache`], and the Axum [`layer`]s.

pub mod cache;
pub mod error;
pub mod layer;
