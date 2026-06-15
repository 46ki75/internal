use crate::BoxFuture;
use std::sync::Arc;

pub trait UseCase {
    fn to_markdown(&self, html: &str) -> String;

    fn fetch_html(&self, url: &str) -> BoxFuture<Result<String, Box<dyn std::error::Error>>>;

    fn parse_feed(&self, text: &str) -> Result<feed_rs::model::Feed, Box<dyn std::error::Error>> {
        let feed = feed_rs::parser::parse(text.as_bytes())?;
        Ok(feed)
    }
}

pub struct UseCaseImpl {
    pub repository: Arc<dyn crate::repository::Repository>,
}

impl UseCase for UseCaseImpl {
    fn to_markdown(&self, html: &str) -> String {
        html2md::rewrite_html(html, false)
    }

    fn fetch_html(&self, url: &str) -> BoxFuture<Result<String, Box<dyn std::error::Error>>> {
        self.repository.fetch_html(url)
    }

    fn parse_feed(&self, rss: &str) -> Result<feed_rs::model::Feed, Box<dyn std::error::Error>> {
        let feed = feed_rs::parser::parse(rss.as_bytes())?;
        Ok(feed)
    }
}
