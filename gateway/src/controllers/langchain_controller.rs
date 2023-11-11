use actix_web::{web, Error, HttpRequest, HttpResponse};
use reqwest::Client;
use std::sync::Arc;

pub async fn forward_request(
    client: web::Data<Arc<Client>>,
    req: HttpRequest,
    body: web::Bytes,
) -> Result<HttpResponse, Error> {
    let url = format!("http://langchain:10002{}", req.uri());
    let forwarded_request = client.request(req.method().clone(), &url);

    let mut request_builder = forwarded_request.body(body);
    for (header_name, header_value) in req.headers() {
        match header_name.as_str() {
            "host" | "authorization" => continue,
            _ => {
                if let Ok(value_str) = header_value.to_str() {
                    request_builder = request_builder.header(header_name.clone(), value_str);
                }
            }
        }
    }

    let response = request_builder.send().await.map_err(|e| {
        eprintln!("Failed to send request: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to send request")
    })?;

    let mut response_builder = HttpResponse::build(response.status());
    for (header_name, header_value) in response.headers() {
        response_builder.insert_header((header_name.clone(), header_value.clone()));
    }

    let response_body = response.bytes().await.map_err(|e| {
        eprintln!("Failed to read response: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to read response")
    })?;

    Ok(response_builder.body(response_body))
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/api/langchain")
            .route(web::get().to(forward_request))
            .route(web::post().to(forward_request)),
    )
    .service(
        web::resource("/api/langchain/{tail:.*}")
            .route(web::get().to(forward_request))
            .route(web::post().to(forward_request)),
    );
}
