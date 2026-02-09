resource "aws_cloudwatch_log_group" "lambda_graphql" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/lambda_graphql"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_subscription_filter" "lambda_graphql_debug" {
  name            = "${terraform.workspace}-46ki75-internal-cloudwatch-subscription_filter-lambda_graphql_debug"
  log_group_name  = aws_cloudwatch_log_group.lambda_graphql.name
  filter_pattern  = "{$.level=\"DEBUG\"}"
  destination_arn = aws_lambda_function.reporter.arn
}

resource "aws_cloudwatch_log_group" "lambda_reporter" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/lambda_reporter"
  retention_in_days = 30
}

