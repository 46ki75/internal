resource "aws_iam_role" "lambda_role" {
  name = "lambda_role"
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

resource "aws_iam_policy" "lambda_policy" {
  name        = "lambda_policy"
  description = "Allow lambda to access cloudwatch logs"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_lambda_function" "mock" {
  function_name = "${var.environment}-lambda"
  role          = aws_iam_role.lambda_role.arn
  filename      = "./bootstrap.zip"
  handler       = "mock.handler"
  runtime       = "provided.al2023"
  architectures = ["x86_64"]
  publish       = true # Publish a new version
}

resource "aws_lambda_alias" "mock" {
  name             = "stable"
  function_name    = aws_lambda_function.mock.function_name
  function_version = aws_lambda_function.mock.version
}
