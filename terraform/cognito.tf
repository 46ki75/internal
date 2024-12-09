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

resource "aws_cognito_user_pool_client" "default" {
  user_pool_id    = aws_cognito_user_pool.default.id
  name            = "${terraform.workspace}-46ki75-internal-cognito-userpool-client"
  generate_secret = false # For SPA
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.default.id
}
