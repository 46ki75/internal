use std::pin::Pin;

use reqwest::header::USER_AGENT;

pub trait Repository {
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

#[derive(Debug)]
pub struct RepositoryImpl {}

impl Repository for RepositoryImpl {
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
        let url = url.to_owned();

        Box::pin(async move {
            let client = reqwest::Client::new();

            let response = client
                .get(url)
                .header(USER_AGENT, "internal-feed/1.0")
                .send()
                .await?;

            let html = response.text().await?;

            Ok(html)
        })
    }
}
