use super::request::*;
use super::response::*;
use axum::response::IntoResponse;
use http::StatusCode;
use http::header::CONTENT_TYPE;

#[utoipa::path(
    get,
    path = "/api/v1/anki/{page_id}",
    params(
            ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Anki", body = Vec<AnkiResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn anki(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Path(page_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    let anki_service = state.anki_service.clone();

    let anki_entity: AnkiResponse = anki_service
        .get_anki_by_id(&page_id)
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .into();

    serde_json::to_string(&anki_entity)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(200)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}

#[utoipa::path(
    get,
    path = "/api/v1/anki",
    params(ListAnkiQueryParams),
    responses(
        (status = 200, description = "Anki", body = Vec<AnkiResponse>),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn anki_list(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Query(query_params): axum::extract::Query<ListAnkiQueryParams>,
) -> impl IntoResponse {
    let anki_service = state.anki_service.clone();

    let anki_entities = anki_service
        .list_anki(
            query_params.page_size.unwrap_or(100).into(),
            query_params.next_cursor,
        )
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .0
        .into_iter()
        .map(|anki| anki.into())
        .collect::<Vec<AnkiResponse>>();

    serde_json::to_string(&anki_entities)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(200)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}

#[utoipa::path(
    get,
    path = "/api/v1/anki/block/{page_id}",
    params(
            ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Anki", body = AnkiBlockResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn block_list(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Path(page_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    let anki_service = state.anki_service.clone();

    let result: AnkiBlockResponse = anki_service
        .list_blocks(&page_id)
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .into();

    serde_json::to_string(&result)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(200)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}

#[utoipa::path(
    post,
    path = "/api/v1/anki",
    request_body = CreateAnkiRequest,
    responses(
        (status = 200, description = "Anki", body = AnkiResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn create_anki(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Json(request): axum::extract::Json<CreateAnkiRequest>,
) -> impl IntoResponse {
    let anki_service = state.anki_service.clone();

    let anki_entity: AnkiResponse = anki_service
        .create_anki(request.title)
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .into();

    serde_json::to_string(&anki_entity)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .map(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(201)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}

#[utoipa::path(
    put,
    path = "/api/v1/anki/{page_id}",
    request_body = UpdateAnkiRequest,
    params(
            ("page_id" = String, Path, description = "UUIDv4"),
    ),
    responses(
        (status = 200, description = "Anki", body = AnkiResponse),
        (status = 500, description = "Internal Server Error", body = String)
    )
)]
pub async fn update_anki(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<crate::router::AxumAppState>>,
    axum::extract::Path(page_id): axum::extract::Path<String>,
    axum::extract::Json(UpdateAnkiRequest {
        ease_factor,
        repetition_count,
        next_review_at,
        is_review_required,
        in_trash,
    }): axum::extract::Json<UpdateAnkiRequest>,
) -> impl IntoResponse {
    let anki_service = state.anki_service.clone();

    let anki_response: AnkiResponse = anki_service
        .update_anki(
            page_id.as_ref(),
            ease_factor,
            repetition_count,
            next_review_at,
            is_review_required,
            in_trash,
        )
        .await
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })?
        .into();

    serde_json::to_string(&anki_response)
        .map_err(|e| {
            let status = StatusCode::INTERNAL_SERVER_ERROR;
            let message = e.to_string();
            (status, message)
        })
        .and_then(|body_string| {
            let body = axum::body::Body::from(body_string);
            axum::response::Response::builder()
                .status(200)
                .header(CONTENT_TYPE, "application/json")
                .body(body)
                .map_err(|e| {
                    let status = StatusCode::INTERNAL_SERVER_ERROR;
                    let message = e.to_string();
                    (status, message)
                })
        })
}
