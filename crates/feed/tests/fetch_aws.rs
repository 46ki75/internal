use feed::use_case::UseCase;
use std::sync::Arc;

#[tokio::test]
#[ignore = "live: fetches a real AWS web page over the network"]
async fn live_fetch_aws() {
    let repository = feed::repository::RepositoryImpl {};
    let use_case = feed::use_case::UseCaseImpl {
        repository: Arc::new(repository),
    };

    let html = use_case
        .repository
        .fetch_html(
            "https://aws.amazon.com/about-aws/whats-new/2026/04/cloudfront-invalidation-cache-tag/",
        )
        .await
        .unwrap();

    let markdown = use_case.to_markdown(&html);

    println!("{}", markdown);
}

#[tokio::test]
#[ignore = "live: fetches a real RSS feed over the network"]
async fn live_parse_feed() {
    let repository = feed::repository::RepositoryImpl {};
    let use_case = feed::use_case::UseCaseImpl {
        repository: Arc::new(repository),
    };

    let rss = use_case
        .repository
        .fetch_html("https://aws.amazon.com/about-aws/whats-new/recent/feed/")
        .await
        .unwrap();

    let feed = use_case.parse_feed(&rss).unwrap();

    for entry in feed.entries.iter().take(1) {
        println!("{:#?}", entry);
    }
}
