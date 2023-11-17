use actix_web::http::StatusCode;
use actix_web::{error, Error, HttpRequest, HttpResponse, HttpResponseBuilder};

use crate::models::response_builder::ErrResponseBuilder;

pub fn handle_json_payload_error(err: error::JsonPayloadError, _req: &HttpRequest) -> error::Error {
    let error_message = match &err {
        error::JsonPayloadError::ContentType => "Invalid content type".to_string(),
        error::JsonPayloadError::Deserialize(json_error) => {
            format!("JSON deserialize error: {}", json_error)
        }
        _ => "Unknown error".to_string(),
    };

    let response = ErrResponseBuilder::new(400).detail(error_message).build();

    let actix_response = HttpResponseBuilder::new(StatusCode::BAD_REQUEST).json(response);

    error::InternalError::from_response(err, actix_response).into()
}

pub async fn handle_internal_server_error(_req: HttpRequest) -> Result<HttpResponse, Error> {
    let response = ErrResponseBuilder::new(500)
        .detail("Internal server error")
        .build();

    Ok(HttpResponse::InternalServerError().json(response))
}
