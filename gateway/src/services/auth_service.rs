use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct AuthService {}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    iss: String,
    sub: String,
    aud: String,
    exp: u64,
    nbf: u64,
    iat: u64,
    jti: String,

    username: String,
}

impl AuthService {
    pub fn verify_user(username: &str, password: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let admin_username = std::env::var("USERNAME")?.to_string();
        let admin_password = std::env::var("PASSWORD")?.to_string();
        Ok(admin_username == username && admin_password == password)
    }

    pub fn generate_jwt() -> Result<String, Box<dyn std::error::Error>> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();

        let exp = now + 3600;

        let claims = Claims {
            iss: "internal_gateway".to_owned(),
            sub: "user_subject".to_owned(),
            aud: "internal_web".to_owned(),
            exp,
            nbf: now,
            iat: now,
            jti: Uuid::new_v4().to_string(),
            username: "myuser".to_owned(),
        };

        let secret = std::env::var("JWT_SECRET_KEY")?.to_string();

        let encoding_key = EncodingKey::from_secret(secret.as_ref());

        let token = encode(&Header::new(Algorithm::HS256), &claims, &encoding_key)?;
        Ok(token)
    }
}
