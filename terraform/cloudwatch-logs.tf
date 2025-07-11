resource "aws_cloudwatch_log_group" "lambda_graphql" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/lambda_graphql"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "notion_notification" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/notion_notification"
  retention_in_days = 30
}
