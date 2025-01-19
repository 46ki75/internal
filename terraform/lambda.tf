data "aws_ssm_parameter" "lambda_env_NOTION_API_KEY" {
  name            = "/${terraform.workspace}/46ki75/internal/notion/secret"
  with_decryption = true
}

data "aws_ssm_parameter" "lambda_env_GITHUB_TOKEN" {
  name            = "/${terraform.workspace}/46ki75/internal/github/secret"
  with_decryption = true
}

data "aws_ssm_parameter" "lambda_env_NOTION_ANKI_DATABASE_ID" {
  name = "/shared/46ki75/internal/notion/anki/database/id"
}

data "aws_ssm_parameter" "lambda_env_NOTION_BOOKMARK_DATABASE_ID" {
  name = "/shared/46ki75/internal/notion/bookmark/database/id"
}

data "aws_ssm_parameter" "lambda_env_NOTION_TODO_DATABASE_ID" {
  name = "/shared/46ki75/internal/notion/todo/database/id"
}

data "aws_ssm_parameter" "lambda_env_NOTION_ROUTINE_DATABASE_ID" {
  name = "/shared/46ki75/internal/notion/routine/database/id"
}

data "aws_ssm_parameter" "lambda_env_DEEPL_API_KEY" {
  name            = "/shared/46ki75/internal/deepl/secret"
  with_decryption = true
}

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
  architectures = ["x86_64"]
  publish       = true # Publish a new version
  timeout       = 30

  environment {
    variables = {
      ENVIRONMENT                 = terraform.workspace
      NOTION_API_KEY              = data.aws_ssm_parameter.lambda_env_NOTION_API_KEY.value
      GITHUB_TOKEN                = data.aws_ssm_parameter.lambda_env_GITHUB_TOKEN.value
      NOTION_ANKI_DATABASE_ID     = data.aws_ssm_parameter.lambda_env_NOTION_ANKI_DATABASE_ID.value
      NOTION_BOOKMARK_DATABASE_ID = data.aws_ssm_parameter.lambda_env_NOTION_BOOKMARK_DATABASE_ID.value
      NOTION_TODO_DATABASE_ID     = data.aws_ssm_parameter.lambda_env_NOTION_TODO_DATABASE_ID.value
      NOTION_ROUTINE_DATABASE_ID  = data.aws_ssm_parameter.lambda_env_NOTION_ROUTINE_DATABASE_ID.value
      DEEPL_API_KEY               = data.aws_ssm_parameter.lambda_env_DEEPL_API_KEY.value
    }
  }
}

resource "aws_lambda_alias" "graphql" {
  name             = "stable"
  function_name    = aws_lambda_function.graphql.function_name
  function_version = "$LATEST"
}

# Cron Routine

resource "aws_iam_role" "lambda_role_routine" {
  name = "${terraform.workspace}-46ki75-internal-iam-role-lambda-routine"
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

resource "aws_iam_policy" "lambda_policy_routine" {
  name        = "${terraform.workspace}-46ki75-internal-iam-policy-lambda-routine"
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

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment_routine" {
  role       = aws_iam_role.lambda_role_routine.name
  policy_arn = aws_iam_policy.lambda_policy_routine.arn
}

resource "aws_lambda_function" "routine" {
  function_name = "${terraform.workspace}-46ki75-internal-lambda-function-routine"
  role          = aws_iam_role.lambda_role_routine.arn
  filename      = "./assets/bootstrap.zip"
  handler       = "bootstrap.handler"
  runtime       = "provided.al2023"
  architectures = ["x86_64"]
  publish       = true # Publish a new version
  timeout       = 30

  environment {
    variables = {
      ENVIRONMENT                = terraform.workspace
      NOTION_API_KEY             = data.aws_ssm_parameter.lambda_env_NOTION_API_KEY.value
      NOTION_ROUTINE_DATABASE_ID = data.aws_ssm_parameter.lambda_env_NOTION_ROUTINE_DATABASE_ID.value
    }
  }
}

resource "aws_lambda_alias" "routine" {
  name             = "stable"
  function_name    = aws_lambda_function.routine.function_name
  function_version = "$LATEST"
}

