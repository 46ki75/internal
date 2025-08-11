pub async fn authentication_middleware(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    // let forbidden_response = axum::response::Response::builder()
    //     .header(http::header::CONTENT_TYPE, "")
    //     .body(axum::body::Body::from(
    //         serde_json::json!({ "message": "forbidden" }).to_string(),
    //     ))
    //     .unwrap();

    // let authorization = match request.headers().get("Authorization") {
    //     Some(auth) => auth,
    //     None => return forbidden_response,
    // };

    // let access_token = match authorization
    //     .to_str()
    //     .ok()
    //     .and_then(|t| t.split("Bearer ").last())
    // {
    //     Some(token) => token,
    //     None => return forbidden_response,
    // };

    // let client = crate::cache::get_or_init_cognito_idp().await;

    // #[derive(Debug, serde::Serialize)]
    // struct User {
    //     username: String,
    //     email: Option<String>,
    //     sub: Option<String>,
    // }

    // let _user = match client
    //     .get_user()
    //     .access_token(access_token)
    //     .send()
    //     .await
    //     .map(|user| {
    //         let username = user.username;

    //         let mut attribute_map = std::collections::HashMap::new();

    //         for attr in user.user_attributes.into_iter() {
    //             if let Some(value) = attr.value {
    //                 attribute_map.insert(attr.name, value);
    //             }
    //         }

    //         let email = attribute_map.get("email").map(|s| s.to_owned());
    //         let sub = attribute_map.get("sub").map(|s| s.to_owned());

    //         User {
    //             username,
    //             email,
    //             sub,
    //         }
    //     }) {
    //     Ok(user) => tracing::info!("{:?}", user),
    //     Err(_) => return forbidden_response,
    // };

    let response = next.run(request).await;

    response
}
