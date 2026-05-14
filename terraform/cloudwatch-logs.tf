resource "aws_cloudwatch_log_group" "lambda_http_api" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/lambda_http_api"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_subscription_filter" "lambda_http_api_warn" {
  name            = "${terraform.workspace}-46ki75-internal-cloudwatch-subscription_filter-lambda_http_api_warn"
  log_group_name  = aws_cloudwatch_log_group.lambda_http_api.name
  filter_pattern  = "{$.level=\"WARN\"}"
  destination_arn = aws_lambda_function.reporter.arn
}

resource "aws_cloudwatch_log_subscription_filter" "lambda_http_api_error" {
  name            = "${terraform.workspace}-46ki75-internal-cloudwatch-subscription_filter-lambda_http_api_error"
  log_group_name  = aws_cloudwatch_log_group.lambda_http_api.name
  filter_pattern  = "{$.level=\"ERROR\"}"
  destination_arn = aws_lambda_function.reporter.arn
}

resource "aws_cloudwatch_log_group" "lambda_reporter" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/lambda_reporter"
  retention_in_days = 30
}
