resource "aws_iam_role" "lambda_role_graphql" {
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

resource "aws_iam_policy" "lambda_policy_graphql" {
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

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment_graphql" {
  role       = aws_iam_role.lambda_role_graphql.name
  policy_arn = aws_iam_policy.lambda_policy_graphql.arn
}

resource "aws_lambda_function" "graphql" {
  function_name = "${terraform.workspace}-46ki75-lambda-function-graphql"
  role          = aws_iam_role.lambda_role_graphql.arn
  filename      = "./assets/bootstrap.zip"
  handler       = "bootstrap.handler"
  runtime       = "provided.al2023"
  architectures = ["x86_64"]
  publish       = true # Publish a new version
}

resource "aws_lambda_alias" "graphql" {
  name             = "stable"
  function_name    = aws_lambda_function.graphql.function_name
  function_version = aws_lambda_function.graphql.version
}
