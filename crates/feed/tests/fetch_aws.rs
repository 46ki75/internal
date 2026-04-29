use feed::use_case::UseCase;
use std::sync::Arc;

#[tokio::test]
async fn fetch_aws() {
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
