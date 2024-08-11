use async_graphql::*;

pub struct QueryRoot;

use crate::resolvers::{self};

#[async_graphql::Object]
impl QueryRoot {
    /// Returns a greeting message along with the programming language.
    pub async fn greet(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<resolvers::greet::Greet, async_graphql::Error> {
        resolvers::greet::Greet::new(ctx)
    }

    /// Anki クエリ
    /// 最上位で認可を行い、子クエリはすべて認可が適用される。
    pub async fn anki(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<resolvers::anki::Anki, async_graphql::Error> {
        resolvers::anki::Anki::new(ctx).await
    }
}
