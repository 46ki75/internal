# GraphQL ----------

resource "aws_iam_role" "lambda_role_graphql" {
  name = "${terraform.workspace}-46ki75-internal-iam-role-lambda-graphql"
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

resource "aws_iam_policy" "lambda_policy_graphql" {
  name        = "${terraform.workspace}-46ki75-internal-iam-policy-lambda-graphql"
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

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment_graphql" {
  role       = aws_iam_role.lambda_role_graphql.name
  policy_arn = aws_iam_policy.lambda_policy_graphql.arn
}

resource "aws_lambda_function" "graphql" {
  function_name = "${terraform.workspace}-46ki75-internal-lambda-function-graphql"
  role          = aws_iam_role.lambda_role_graphql.arn
  filename      = "./assets/bootstrap.zip"
  handler       = "bootstrap.handler"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  publish       = true # Publish a new version
  timeout       = 30

  logging_config {
    log_group             = aws_cloudwatch_log_group.lambda_graphql.name
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
      RUST_LOG        = "internal_graphql=debug"
      RUST_LOG_FORMAT = "JSON"
    }
  }
}

resource "aws_lambda_alias" "graphql" {
  name             = "stable"
  function_name    = aws_lambda_function.graphql.function_name
  function_version = "$LATEST"
}
