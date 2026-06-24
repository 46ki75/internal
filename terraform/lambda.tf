# HTTP API ----------

resource "aws_iam_role" "lambda_role_http_api" {
  name = "${terraform.workspace}-46ki75-internal-iam-role-lambda-http-api"
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

resource "aws_iam_policy" "lambda_policy_http_api" {
  name        = "${terraform.workspace}-46ki75-internal-iam-policy-lambda-http-api"
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
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "kms:Decrypt",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment_http_api" {
  role       = aws_iam_role.lambda_role_http_api.name
  policy_arn = aws_iam_policy.lambda_policy_http_api.arn
}

resource "aws_lambda_function" "http_api" {
  function_name = "${terraform.workspace}-46ki75-internal-lambda-function-http-api"
  role          = aws_iam_role.lambda_role_http_api.arn
  filename      = "./assets/bootstrap.zip"
  handler       = "bootstrap.handler"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  publish       = true # Publish a new version
  timeout       = 30

  logging_config {
    log_group             = aws_cloudwatch_log_group.lambda_http_api.name
    log_format            = "JSON"
    application_log_level = "DEBUG"
    system_log_level      = "INFO"
  }

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      STAGE_NAME      = terraform.workspace
      # Each feature crate logs under its own `http_api_<feature>` target, so the
      # filter lists them all (the binary itself logs under `http_api`).
      RUST_LOG        = "http_api=debug,http_api_core=debug,http_api_anki=debug,http_api_bookmark=debug,http_api_icon=debug,http_api_image=debug,http_api_to_do=debug,http_api_trivia=debug,http_api_typing=debug"
      RUST_LOG_FORMAT = "JSON"
    }
  }
}

resource "aws_lambda_alias" "http_api" {
  name             = "stable"
  function_name    = aws_lambda_function.http_api.function_name
  function_version = "$LATEST"
}
