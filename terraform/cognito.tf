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

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.spa.id
}

data "aws_ssm_parameter" "password" {
  name            = "/${terraform.workspace}/46ki75/internal/cognito/userpool/user/password"
  with_decryption = true
}

resource "aws_cognito_user" "shirayuki" {
  user_pool_id = aws_cognito_user_pool.default.id
  username     = "shirayuki"
  password     = data.aws_ssm_parameter.password.value
  enabled      = true
}

resource "aws_cognito_user_group" "admin" {
  user_pool_id = aws_cognito_user_pool.default.id
  name         = "admin"
  description  = "Administrators"
}

resource "aws_cognito_user_in_group" "shirayuki_in_admin" {
  user_pool_id = aws_cognito_user_pool.default.id
  username     = aws_cognito_user.shirayuki.username
  group_name   = aws_cognito_user_group.admin.name
}
