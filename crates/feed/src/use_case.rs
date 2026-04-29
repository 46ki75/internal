use std::{pin::Pin, sync::Arc};

pub trait UseCase {
    fn to_markdown(&self, html: &str) -> String;

    fn fetch_html(
        &self,
        url: &str,
    ) -> Pin<
        Box<
            dyn std::future::Future<Output = Result<String, Box<dyn std::error::Error>>>
                + Send
                + Sync,
        >,
    >;
}

pub struct UseCaseImpl {
    pub repository: Arc<dyn crate::repository::Repository>,
}

impl UseCase for UseCaseImpl {
    fn to_markdown(&self, html: &str) -> String {
        html2md::rewrite_html(html, false)
    }

    fn fetch_html(
        &self,
        url: &str,
    ) -> Pin<
        Box<
            dyn std::future::Future<Output = Result<String, Box<dyn std::error::Error>>>
                + Send
                + Sync,
        >,
    > {
        self.repository.fetch_html(url)
    }
}
