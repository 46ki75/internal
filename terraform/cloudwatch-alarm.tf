resource "aws_cloudwatch_metric_alarm" "lambda_graphql" {
  alarm_name          = "${terraform.workspace}-46ki75-internal-cloudwatch-alarm-lambda-graphql"
  alarm_description   = "Alarm when lambda graphql fails"
  comparison_operator = "GreaterThanOrEqualToThreshold"

  namespace   = "AWS/Lambda"
  metric_name = "Errors"
  dimensions = {
    FunctionName = aws_lambda_alias.graphql.function_name
    Resource     = aws_lambda_alias.graphql.function_name
  }

  period              = 60
  evaluation_periods  = 1
  statistic           = "Sum"
  datapoints_to_alarm = 1
  threshold           = 1
  alarm_actions       = [aws_sns_topic.error.arn]
  treat_missing_data  = "notBreaching"
}
