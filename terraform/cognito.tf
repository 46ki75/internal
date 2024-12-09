resource "aws_cognito_user_pool" "default" {
  name = "${terraform.workspace}-46ki75-internal-cognito-userpool"

  # Disable self sign-up
  admin_create_user_config {
    allow_admin_create_user_only = true
  }
}

output "user_pool_id" {
  value = aws_cognito_user_pool.default.id
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
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.spa.id
}
