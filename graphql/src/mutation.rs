use async_graphql::*;

pub struct MutationRoot;

#[async_graphql::Object]
impl MutationRoot {
    /// 認証認可関連のクエリ
    pub async fn auth(&self) -> Result<crate::resolvers::auth::Auth, async_graphql::Error> {
        crate::resolvers::auth::Auth::new().await
    }
}
