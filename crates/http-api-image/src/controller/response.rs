use crate::use_case::output::*;
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
    pub images: Vec<String>,
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
            images: value.images,
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

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
pub struct ImageTagResponse {
    pub tag_name: String,
    pub url: String,
    pub tag_type: String,
}

impl From<ImageTagOutput> for ImageTagResponse {
    fn from(value: ImageTagOutput) -> Self {
        Self {
            tag_name: value.tag_name,
            url: value.url,
            tag_type: value.tag_type,
        }
    }
}
