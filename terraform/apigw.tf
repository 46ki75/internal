resource "aws_apigatewayv2_api" "backend" {
  name          = "${terraform.workspace}-46ki75-apigwv2-http-backend"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id           = aws_apigatewayv2_api.backend.id
  integration_type = "AWS_PROXY"

  connection_type = "INTERNET"
  integration_uri = aws_lambda_alias.graphql.invoke_arn
}

resource "aws_apigatewayv2_route" "backend" {
  api_id             = aws_apigatewayv2_api.backend.id
  route_key          = "ANY /graphql"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.backend.id
}

resource "aws_apigatewayv2_stage" "backend" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = terraform.workspace
  auto_deploy = true


  route_settings {
    route_key              = aws_apigatewayv2_route.backend.route_key
    throttling_burst_limit = 100000
    throttling_rate_limit  = 100000
  }
}

resource "aws_apigatewayv2_domain_name" "backend" {
  domain_name = aws_acm_certificate.api_cert.domain_name
  domain_name_configuration {
    certificate_arn = aws_acm_certificate.api_cert.arn
    security_policy = "TLS_1_2"
    endpoint_type   = "REGIONAL"
  }
}

resource "aws_apigatewayv2_api_mapping" "backend" {
  api_id      = aws_apigatewayv2_api.backend.id
  domain_name = aws_apigatewayv2_domain_name.backend.domain_name
  stage       = aws_apigatewayv2_stage.backend.name
}

resource "aws_route53_record" "api_gateway" {
  zone_id = data.aws_route53_zone.internal.zone_id
  name    = "${terraform.workspace}-apigw.internal.46ki75.com"
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.backend.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.backend.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# >>> Authorize
resource "aws_apigatewayv2_authorizer" "backend" {
  name             = "${terraform.workspace}-46ki75-apigwv2-http-backend-authorizer"
  authorizer_type  = "JWT"
  api_id           = aws_apigatewayv2_api.backend.id
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.spa.id]
    issuer   = "https://${aws_cognito_user_pool.default.endpoint}"
  }
}
# <<< Authorize

resource "aws_lambda_permission" "apigwv2" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_alias.graphql.function_name
  qualifier     = aws_lambda_alias.graphql.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*/*"
}

output "backend_apigw_url" {
  value = "https://${aws_apigatewayv2_domain_name.backend.domain_name}"
}

output "backend_apigw_url_graphql" {
  value = "https://${aws_apigatewayv2_domain_name.backend.domain_name}/graphql"
}
