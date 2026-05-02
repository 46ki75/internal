use std::sync::Arc;

use axum::{extract::State, response::IntoResponse};

mod request {}
mod response {
    use super::super::use_case::output::*;
    use serde::{Deserialize, Serialize};
    use utoipa::ToSchema;

    #[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
    pub struct FetchImagesResponse {
        pub images: Vec<ImageResponse>,
        pub next_cursor: Option<String>,
    }

    impl From<ImagePageOutput> for FetchImagesResponse {
        fn from(value: ImagePageOutput) -> Self {
            Self {
                images: value.images.into_iter().map(ImageResponse::from).collect(),
                next_cursor: value.next_cursor,
            }
        }
    }

    #[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
    pub struct ImageResponse {
        pub title: String,
        pub name: String,
        pub sources: Vec<ImageSourceResponse>,
        pub url: Option<String>,
        pub tags: Vec<String>,
        pub notable_tags: Vec<String>,
        pub uploaded_at: Option<String>,
    }

    impl From<ImageOutput> for ImageResponse {
        fn from(value: ImageOutput) -> Self {
            Self {
                title: value.title,
                name: value.name,
                sources: value
                    .sources
                    .into_iter()
                    .map(ImageSourceResponse::from)
                    .collect(),
                url: value.url,
                tags: value.tags,
                notable_tags: value.notable_tags,
                uploaded_at: value.uploaded_at,
            }
        }
    }

    #[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
    pub struct ImageSourceResponse {
        pub id: String,
        pub name: String,
        pub color: String,
    }

    impl From<ImageSourceOutput> for ImageSourceResponse {
        fn from(value: ImageSourceOutput) -> Self {
            Self {
                id: value.id,
                name: value.name,
                color: value.color,
            }
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/image",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Images", body = Vec<response::FetchImagesResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn fetch_images(
    State(use_case): State<Arc<super::use_case::ImageUseCase>>,
) -> impl IntoResponse {
    let image_page = use_case.fetch_images().await;

    match image_page {
        Ok(image_page) => {
            let response = response::FetchImagesResponse::from(image_page);
            axum::Json(response).into_response()
        }
        Err(_) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Internal Server Error".to_string(),
        )
            .into_response(),
    };
}
