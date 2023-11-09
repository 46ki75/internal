use actix_files as fs;
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer, Result};
use reqwest::Client;

async fn forward_request(req: HttpRequest, body: web::Bytes) -> Result<HttpResponse> {
    let client = Client::new();
    let url = format!("http://localhost:10002{}", req.uri());

    println!("{}", url);

    let mut forwarded_request = client.request(req.method().clone(), &url);
    for (header_name, header_value) in req.headers() {
        forwarded_request =
            forwarded_request.header(header_name.as_str(), header_value.to_str().unwrap());
    }

    let response = forwarded_request.body(body).send().await.map_err(|e| {
        eprintln!("Failed to send request: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to send request")
    })?;

    let mut response_builder = HttpResponse::build(response.status());
    for (header_name, header_value) in response.headers() {
        response_builder.append_header((header_name, header_value));
    }

    let response_body = response.bytes().await.map_err(|e| {
        eprintln!("Failed to read response: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to read response")
    })?;

    Ok(response_builder.body(response_body))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/api/langchain", web::get().to(forward_request))
            .route("/api/langchain/{tail:.*}", web::to(forward_request))
            .service(fs::Files::new("/", "./dist").index_file("index.html"))
    })
    .bind(("0.0.0.0", 10000))?
    .run()
    .await
}
