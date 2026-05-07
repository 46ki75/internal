pub mod request;
pub mod response;
pub mod router;

use self::response::TypingResponse;
use axum::{extract::State, response::IntoResponse};
use std::sync::Arc;

#[utoipa::path(
    get,
    path = "/api/v1/typing",
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Typing list", body = Vec<TypingResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn typing_list(
    State(state): State<Arc<crate::typing::controller::router::TypingState>>,
) -> impl IntoResponse {
    let typing_use_case = state.typing_use_case.clone();

    match typing_use_case.typing_list().await {
        Ok(results) => axum::Json(
            results
                .into_iter()
                .map(TypingResponse::from)
                .collect::<Vec<_>>(),
        )
        .into_response(),
        Err(e) => {
            tracing::error!("Error listing typing: {:?}", e);
            axum::response::Response::builder()
                .status(500)
                .body(axum::body::Body::from("Internal Server Error".to_owned()))
                .unwrap()
                .into_response()
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/typing",
    request_body = self::request::TypingUpsertRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Upsert typing", body = TypingResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn upsert_typing(
    State(state): State<Arc<crate::typing::controller::router::TypingState>>,
    axum::extract::Json(request): axum::extract::Json<self::request::TypingUpsertRequest>,
) -> impl IntoResponse {
    let typing_use_case = state.typing_use_case.clone();

    match typing_use_case
        .upsert_typing(request.id, request.text, request.description)
        .await
    {
        Ok(result) => axum::Json(TypingResponse::from(result)).into_response(),
        Err(e) => {
            tracing::error!("Error upserting typing: {:?}", e);
            axum::response::Response::builder()
                .status(500)
                .body(axum::body::Body::from("Internal Server Error".to_owned()))
                .unwrap()
                .into_response()
        }
    }
}

#[utoipa::path(
    delete,
    path = "/api/v1/typing",
    request_body = self::request::TypingDeleteRequest,
    params(
        ("Authorization" = String, Header),
    ),
    responses(
        (status = 200, description = "Delete typing", body = TypingResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn delete_typing(
    State(state): State<Arc<crate::typing::controller::router::TypingState>>,
    axum::extract::Json(request): axum::extract::Json<self::request::TypingDeleteRequest>,
) -> impl IntoResponse {
    let typing_use_case = state.typing_use_case.clone();

    match typing_use_case.delete_typing(request.id).await {
        Ok(result) => axum::Json(TypingResponse::from(result)).into_response(),
        Err(e) => {
            tracing::error!("Error deleting typing: {:?}", e);
            axum::response::Response::builder()
                .status(500)
                .body(axum::body::Body::from("Internal Server Error".to_owned()))
                .unwrap()
                .into_response()
        }
    }
}
