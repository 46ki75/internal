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
