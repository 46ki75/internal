use crate::models::response_builder::{ErrResponseBuilder, NormalResponseBuilder};
use crate::services::auth_service::AuthService;
use actix_web::{web, HttpResponse, Responder};
use serde_json::json;

#[allow(dead_code)]
#[derive(serde::Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

pub async fn login(login_request: web::Json<LoginRequest>) -> impl Responder {
    let login_data = login_request.into_inner();

    match AuthService::verify_user(&login_data.username, &login_data.password) {
        Ok(is_valid) => {
            if is_valid {
                match AuthService::generate_jwt() {
                    Ok(token) => {
                        let response = NormalResponseBuilder::new()
                            .push_data(json!({ "token": token }))
                            .build();
                        HttpResponse::Ok().json(response)
                    }
                    Err(_) => {
                        let response = ErrResponseBuilder::new(500)
                            .detail("An unknown error occurred during JWT generation")
                            .build();
                        HttpResponse::InternalServerError().json(response)
                    }
                }
            } else {
                let response = ErrResponseBuilder::new(401)
                    .detail("Invalid username or password")
                    .build();
                HttpResponse::Unauthorized().json(response)
            }
        }
        Err(_) => {
            let response = ErrResponseBuilder::new(500)
                .detail("An unknown error occurred during user authentication")
                .build();
            HttpResponse::InternalServerError().json(response)
        }
    }
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/login").route(web::post().to(login)));
}
