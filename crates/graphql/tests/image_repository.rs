use internal_graphql::image::repository::{ImageRepository, ImageRepositoryImpl};

#[tokio::test]
async fn test_fetch_image_tags() {
    let repository = ImageRepositoryImpl {};

    let result = repository.fetch_image_tags().await;

    print!("{:#?}", result);

    assert!(result.is_ok());
}

#[tokio::test]
async fn test_fetch_images() {
    let repository = ImageRepositoryImpl {};

    let result = repository.fetch_images().await;

    print!("{:#?}", result);

    assert!(result.is_ok());
}
