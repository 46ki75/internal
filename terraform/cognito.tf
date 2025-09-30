resource "aws_cognito_user_pool" "default" {
  name = "${terraform.workspace}-46ki75-internal-cognito-userpool"

  # Disable self sign-up
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = false
  }

  sign_in_policy {
    allowed_first_auth_factors = ["PASSWORD", "WEB_AUTHN"]
  }

  web_authn_configuration {
    relying_party_id  = terraform.workspace == "prod" ? "internal.46ki75.com" : terraform.workspace == "stg" ? "stg-internal.46ki75.com" : "dev-internal.46ki75.com"
    user_verification = "preferred"
  }
}

output "user_pool_id" {
  value = aws_cognito_user_pool.default.id
}

output "jwks_uri" {
  value = "https://${aws_cognito_user_pool.default.endpoint}/.well-known/jwks.json"
}

# SPA
resource "aws_cognito_user_pool_client" "spa" {
  user_pool_id    = aws_cognito_user_pool.default.id
  name            = "${terraform.workspace}-46ki75-internal-cognito-client-spa"
  generate_secret = false # For SPA

  refresh_token_validity = 7
  access_token_validity  = 30
  id_token_validity      = 30

  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  explicit_auth_flows = ["ALLOW_USER_AUTH", "ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}

# M2M (for Debugging)
resource "aws_cognito_user_pool_client" "m2m4debug" {
  user_pool_id    = aws_cognito_user_pool.default.id
  name            = "${terraform.workspace}-46ki75-internal-cognito-client-m2m4debug"
  generate_secret = true

  access_token_validity = 10

  token_validity_units {
    access_token = "minutes"
  }

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["client_credentials"]
  allowed_oauth_scopes                 = ["debug/read"] # custom scope

  explicit_auth_flows = []
}

resource "aws_cognito_resource_server" "debug" {
  identifier   = "debug"
  name         = "Debug Resource Server"
  user_pool_id = aws_cognito_user_pool.default.id

  scope {
    scope_name        = "read"
    scope_description = "Read access to debug resources"
  }
}
