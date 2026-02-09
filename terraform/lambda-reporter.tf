# reporter ----------

resource "aws_iam_role" "lambda_role_reporter" {
  name = "${terraform.workspace}-46ki75-internal-iam-role-lambda-reporter"
  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "lambda.amazonaws.com"
        },
        "Action" : "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_policy_reporter" {
  name        = "${terraform.workspace}-46ki75-internal-iam-policy-lambda-reporter"
  description = "Allow lambda to access cloudwatch logs"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "sns:Publish"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment_reporter" {
  role       = aws_iam_role.lambda_role_reporter.name
  policy_arn = aws_iam_policy.lambda_policy_reporter.arn
}

resource "aws_lambda_function" "reporter" {
  function_name = "${terraform.workspace}-46ki75-internal-lambda-function-reporter"
  role          = aws_iam_role.lambda_role_reporter.arn
  filename      = "./assets/bootstrap.zip"
  handler       = "bootstrap.handler"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  publish       = true # Publish a new version
  timeout       = 30

  logging_config {
    log_group             = aws_cloudwatch_log_group.lambda_reporter.name
    log_format            = "JSON"
    application_log_level = "DEBUG"
    system_log_level      = "INFO"
  }

  environment {
    variables = {
      STAGE_NAME      = terraform.workspace
      RUST_LOG        = "logs_reporter=debug"
      RUST_LOG_FORMAT = "JSON"

      SNS_INFO_TOPIC_ARN  = aws_sns_topic.info.arn
      SNS_WARN_TOPIC_ARN  = aws_sns_topic.warn.arn
      SNS_ERROR_TOPIC_ARN = aws_sns_topic.error.arn
    }
  }
}

resource "aws_lambda_alias" "reporter" {
  name             = "stable"
  function_name    = aws_lambda_function.reporter.function_name
  function_version = "$LATEST"
}

resource "aws_lambda_permission" "allow_cloudwatch_logs" {
  statement_id   = "AllowExecutionFromCloudWatchLogs"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.reporter.function_name
  principal      = "logs.amazonaws.com"
  source_arn     = "${aws_cloudwatch_log_group.lambda_graphql.arn}:*"
  source_account = data.aws_caller_identity.current.account_id
}
