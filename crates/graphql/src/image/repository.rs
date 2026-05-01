use std::pin::Pin;

pub trait ImageRepository {
    fn fetch_images(
        &self,
    ) -> Pin<Box<dyn Future<Output = Result<Vec<super::dto::ImageDto>, crate::error::Error>> + Send>>;
}

pub struct ImageRepositoryImpl {}

// impl ImageRepository for ImageRepositoryImpl {
//     fn fetch_images(
//         &self,
//     ) -> Pin<Box<dyn Future<Output = Result<Vec<super::dto::ImageDto>, crate::error::Error>> + Send>>
//     {
//         Box::pin(async move {
//             let notionrs_client = crate::cache::get_or_init_notionrs_client().await?;

//             todo!();
//         })
//     }
// }
