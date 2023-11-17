// use jsonwebtoken::errors::Error as JwtError;
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AuthService {}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    username: String,
    password: String,
    exp: usize,
}

impl AuthService {
    pub fn login() -> Result<String, Box<dyn std::error::Error>> {
        let claims = Claims {
            username: "myuser".to_owned(),
            password: "mypass".to_owned(),
            exp: 10000000000,
        };

        let secret = std::env::var("JWT_SECRET_KEY")?.to_string();

        let encoding_key = EncodingKey::from_secret(secret.as_ref());

        let token = encode(&Header::new(Algorithm::HS256), &claims, &encoding_key)?;
        Ok(token)
    }
}
