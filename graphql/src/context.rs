use cookie::Cookie;
use juniper::Context;
use lambda_http::http::HeaderMap;

pub struct GraphQLContext {
    pub headers: HeaderMap,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
}

impl GraphQLContext {
    pub fn new(headers: HeaderMap) -> Self {
        let mut access_token = None;
        let mut refresh_token = None;

        let cookie_str = headers
            .get("cookie")
            .and_then(|value| value.to_str().ok())
            .unwrap_or("");

        for cookie_str in cookie_str.split(';').map(|s| s.trim()) {
            if let Ok(cookie) = Cookie::parse(cookie_str) {
                if cookie.name() == "ACCESS_TOKEN" {
                    access_token = Some(cookie.value().to_string());
                } else if cookie.name() == "REFRESH_TOKEN" {
                    refresh_token = Some(cookie.value().to_string());
                }
            }
        }

        GraphQLContext {
            headers,
            access_token,
            refresh_token,
        }
    }
}

impl Context for GraphQLContext {}
