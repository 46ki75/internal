use http_api::image::repository::{ImageRepository, ImageRepositoryImpl};

#[tokio::test]
#[ignore = "live: hits Notion via AWS-backed config, requires network + credentials"]
async fn live_fetch_image_tags() {
    let repository = ImageRepositoryImpl {};

    let result = repository.fetch_image_tags().await;

    print!("{:#?}", result);

    assert!(result.is_ok());
}

#[tokio::test]
#[ignore = "live: hits Notion via AWS-backed config, requires network + credentials"]
async fn live_fetch_images() {
    let repository = ImageRepositoryImpl {};

    let result = repository.fetch_images().await;

    print!("{:#?}", result);

    assert!(result.is_ok());
}
