resource "aws_cloudwatch_event_rule" "lambda_routine" {
  name        = "${terraform.workspace}-46ki75-internal-eventbridge-lambda-routine"
  description = "Trigger lambda routine"

  schedule_expression = "cron(0 15 * * ? *)"
}

resource "aws_cloudwatch_event_target" "lambda_routine" {
  rule = aws_cloudwatch_event_rule.lambda_routine.name
  arn  = aws_lambda_alias.routine.arn
}
