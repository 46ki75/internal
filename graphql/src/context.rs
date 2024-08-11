#[derive(Debug)]
pub struct CustomContext {
    /// The environment variable that indicates the deployment environment.
    /// `development` or `production`
    pub environment: String,

    pub domain: String,
}

impl CustomContext {
    pub fn new(event: lambda_http::Request) -> Self {
        let environment = std::env::var("ENVIRONMENT")
            .unwrap_or_else(|_| panic!("The `ENVIRONMENT` variable must always be set."));

        CustomContext {
            environment,
            domain: event.uri().host().unwrap().into(),
        }
    }
}
