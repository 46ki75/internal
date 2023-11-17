use crate::models::response_builder::NormalResponseBuilder;
use crate::services::auth_service::AuthService;
use actix_web::{web, HttpResponse, Responder};
use serde_json::json;

pub async fn login() -> impl Responder {
    match AuthService::login() {
        Ok(result) => {
            let response = NormalResponseBuilder::new()
                .push_data(json!({ "token":result }))
                .build();
            HttpResponse::Ok().json(response)
        }
        Err(err) => HttpResponse::InternalServerError().body(format!("Error: {}", err)),
    }
}

#[allow(dead_code)]
#[derive(serde::Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/login").route(web::post().to(login)));
}
