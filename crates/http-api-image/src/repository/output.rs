use notionrs::types::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct ImageBooruResponseDto {
    pub tag_string_artist: String,
    pub tag_string_copyright: String,
    pub tag_string_character: String,
    pub tag_string_general: String,
    pub tag_string_meta: String,
    pub updated_at: String,
    pub media_asset: ImageBooruMediaAssetDto,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ImageBooruMediaAssetDto {
    pub variants: Vec<ImageBooruVariantDto>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ImageBooruVariantDto {
    pub r#type: String,
    pub url: String,
    pub width: u32,
    pub height: u32,
    pub file_ext: String,
}

#[cfg(test)]
mod test {
    use super::*;

    #[tokio::test]
    #[ignore = "requires external network access to danbooru.donmai.us"]
    async fn test_deserialize_image_booru_response() {
        let json = reqwest::get("https://danbooru.donmai.us/posts/11037393.json")
            .await
            .unwrap()
            .bytes()
            .await
            .unwrap();

        let response: ImageBooruResponseDto = serde_json::from_slice(&json).unwrap();

        assert_eq!(response.tag_string_artist, "ikuma_yamashita");
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ImageDto {
    #[serde(rename = "Title")]
    pub title: PageTitleProperty,

    #[serde(rename = "Name")]
    pub name: PageRichTextProperty,

    #[serde(rename = "Sources")]
    pub sources: PageMultiSelectProperty,

    #[serde(rename = "URL")]
    pub url: PageUrlProperty,

    #[serde(rename = "Tags")]
    pub tags: PageRelationProperty,

    #[serde(rename = "Notable Tags")]
    pub notable_tags: PageRelationProperty,

    #[serde(rename = "Uploaded At")]
    pub uploaded_at: PageDateProperty,

    #[serde(rename = "Images")]
    pub images: PageFilesProperty,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ImagePageDto {
    pub images: Vec<ImageDto>,
    pub next_cursor: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ImageTagDto {
    #[serde(rename = "Tag Name")]
    pub tag_name: PageTitleProperty,

    #[serde(rename = "URL")]
    pub url: PageUrlProperty,

    #[serde(rename = "Tag Type")]
    pub tag_type: PageSelectProperty,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum ImageTagTypeDtoInput {
    Artist,
    Copyright,
    Character,
    General,
    Meta,
}
