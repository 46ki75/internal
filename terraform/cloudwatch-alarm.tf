resource "aws_cloudwatch_metric_alarm" "lambda_http_api" {
  alarm_name          = "${terraform.workspace}-46ki75-internal-cloudwatch-alarm-lambda-http-api"
  alarm_description   = "Alarm when lambda http-api fails"
  comparison_operator = "GreaterThanOrEqualToThreshold"

  namespace   = "AWS/Lambda"
  metric_name = "Errors"
  dimensions = {
    FunctionName = aws_lambda_alias.http_api.function_name
    Resource     = aws_lambda_alias.http_api.function_name
  }

  period              = 60
  evaluation_periods  = 1
  statistic           = "Sum"
  datapoints_to_alarm = 1
  threshold           = 1
  alarm_actions       = [aws_sns_topic.error.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "apigw_http_api" {
  alarm_name          = "${terraform.workspace}-46ki75-internal-cloudwatch-alarm-apigw-http-api_5xx"
  alarm_description   = "Alarm when apigw http-api fails"
  comparison_operator = "GreaterThanOrEqualToThreshold"

  namespace   = "AWS/ApiGateway"
  metric_name = "5xx"
  dimensions = {
    ApiId = aws_apigatewayv2_api.backend.id
  }

  period              = 60
  evaluation_periods  = 1
  statistic           = "Sum"
  datapoints_to_alarm = 1
  threshold           = 1
  alarm_actions       = [aws_sns_topic.error.arn]
  treat_missing_data  = "notBreaching"
}
