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
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "ANY /graphql"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
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

resource "aws_lambda_permission" "apigwv2" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_alias.graphql.function_name}:${aws_lambda_alias.graphql.name}"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*/*"
}

output "backend_apigw_url" {
  value = aws_apigatewayv2_api.backend.api_endpoint
}
