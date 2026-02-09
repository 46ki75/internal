use super::response::*;
use axum::{extract::State, response::IntoResponse};
use std::sync::Arc;

#[utoipa::path(
    get,
    path = "/api/v1/icon",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Icon", body = Vec<IconResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn list_icons(
    State(state): State<Arc<crate::router::AxumAppState>>,
) -> impl IntoResponse {
    let icon_service = state.icon_service.clone();

    let response = match icon_service.list_icons().await {
        Ok(icon_entities) => {
            let icon_responses = icon_entities
                .into_iter()
                .map(|icon_entity| IconResponse::from(icon_entity))
                .collect::<Vec<IconResponse>>();

            axum::Json(icon_responses).into_response()
        }

        Err(e) => {
            tracing::error!("Error listing icons: {:?}", e);

            let body = axum::body::Body::from("Internal Server Error".to_owned());

            let response = axum::response::Response::builder()
                .status(500)
                .body(body)
                .unwrap();

            response.into_response()
        }
    };

    response
}
