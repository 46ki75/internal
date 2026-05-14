use http::StatusCode;

#[derive(Debug, Clone)]
pub struct AuthLayer {}

impl AuthLayer {
    pub fn new() -> Self {
        Self {}
    }
}

impl<S> tower::Layer<S> for AuthLayer {
    type Service = AuthMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AuthMiddleware { inner }
    }
}

#[derive(Debug, Clone)]
pub struct AuthMiddleware<S> {
    inner: S,
}

impl<S> AuthMiddleware<S> {
    // TODO:
    // This function does not work because it allows credentials that are tied to a user identity.
    // However some access tokens are issued by M2M OAuth clients (using the Client Credentials Grant).
    // Therefore, we need to update this code to verify whether the received token is valid.

    async fn validate_access_token(
        headers: &http::HeaderMap<http::HeaderValue>,
    ) -> Result<(), axum::response::Response> {
        let sdk_config = &aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

        let client = aws_sdk_cognitoidentityprovider::Client::new(&sdk_config);

        let authorization_header_value = Self::extract_authorization_header_value(headers).ok_or(
            axum::response::IntoResponse::into_response((
                StatusCode::UNAUTHORIZED,
                "An access token is required in the `Authorization` header.",
            )),
        )?;

        let access_token = Self::normalize_bearer_token(authorization_header_value).ok_or(
            axum::response::IntoResponse::into_response((
                StatusCode::UNAUTHORIZED,
                "Invalid `Authorization` header value format.",
            )),
        )?;

        let result = client.get_user().access_token(access_token).send().await;

        let user = match result {
            Ok(_user) => Ok(()),
            Err(_) => Err(axum::response::IntoResponse::into_response((
                StatusCode::UNAUTHORIZED,
                "Invalid token.",
            ))),
        };

        user
    }

    fn extract_authorization_header_value(
        headers: &http::HeaderMap<http::HeaderValue>,
    ) -> Option<String> {
        let value =
            headers
                .get(http::header::AUTHORIZATION)
                .and_then(|authorization_header_value| {
                    authorization_header_value
                        .to_str()
                        .ok()
                        .map(|s| s.to_owned())
                });

        value
    }

    fn normalize_bearer_token(autorization_header_value: String) -> Option<String> {
        let re: regex::Regex = regex::Regex::new(r"^(?:Bearer\s+)?([A-Za-z0-9\-_\.=]+)$").unwrap();

        let token = re.captures(&autorization_header_value).and_then(|t| {
            let first = t.get(1).map(|m| m.as_str().to_string());
            first
        });

        token
    }
}

impl<S> tower::Service<axum::extract::Request> for AuthMiddleware<S>
where
    S: tower::Service<axum::extract::Request, Response = axum::response::Response>
        + Send
        + Clone
        + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = futures::future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: axum::extract::Request) -> Self::Future {
        let mut inner = self.inner.clone();
        let headers = request.headers().clone();

        Box::pin(async move {
            if let Err(resp) = Self::validate_access_token(&headers).await {
                return Ok(resp);
            }

            let response: axum::response::Response = inner.call(request).await?;
            Ok(response)
        })
    }
}
