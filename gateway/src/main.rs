mod controllers;

use actix_files as fs;
use actix_web::{middleware::Logger, web, App, HttpServer};
use controllers::langchain_controller;
use reqwest::Client;
use std::sync::Arc;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let client = Arc::new(Client::new());

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(client.clone()))
            .configure(langchain_controller::config)
            .service(fs::Files::new("/", "./dist").index_file("index.html"))
    })
    .bind("0.0.0.0:10000")?
    .run()
    .await
}
