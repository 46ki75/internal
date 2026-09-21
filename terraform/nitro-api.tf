variable "nitro_api_features" {
  description = "Features routed to Nitro; override during a staged migration."
  type        = set(string)
  default     = ["anki", "bookmark", "icon", "image", "to-do", "trivia"]
  validation {
    condition     = alltrue([for feature in var.nitro_api_features : contains(["anki", "bookmark", "icon", "image", "to-do", "trivia"], feature)])
    error_message = "Unknown Nitro API feature."
  }
}

locals {
  nitro_api_routes = toset(concat(["GET /api/health/nitro"], flatten([
    for feature in var.nitro_api_features : [
      "ANY /api/v1/${feature}",
      "ANY /api/v1/${feature}/{proxy+}"
    ]
  ])))
}

resource "aws_s3_bucket" "nitro_api_artifacts" {
  bucket = "${terraform.workspace}-46ki75-internal-s3-bucket-nitro-api-artifacts"
}

resource "aws_s3_bucket_versioning" "nitro_api_artifacts" {
  bucket = aws_s3_bucket.nitro_api_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "nitro_api_artifacts" {
  bucket                  = aws_s3_bucket.nitro_api_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "nitro_api_artifacts" {
  bucket = aws_s3_bucket.nitro_api_artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Resolve the published artifact to immutable bits at plan time, like the
# AgentCore image digest. Other stack deployments need no local Nitro build.
data "aws_s3_object" "nitro_api" {
  bucket        = aws_s3_bucket.nitro_api_artifacts.id
  key           = "nitro-api/lambda.zip"
  checksum_mode = "ENABLED"
  download_body = false
}

resource "aws_iam_role" "lambda_nitro_api" {
  name = "${terraform.workspace}-46ki75-internal-iam-role-lambda-nitro-api"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "lambda_nitro_api" {
  role = aws_iam_role.lambda_nitro_api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.lambda_nitro_api.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = "arn:aws:ssm:ap-northeast-1:${data.aws_caller_identity.current.account_id}:parameter/${terraform.workspace}/46ki75/internal/notion/*"
      },
      {
        Effect    = "Allow"
        Action    = ["kms:Decrypt"]
        Resource  = "*"
        Condition = { StringEquals = { "kms:ViaService" = "ssm.ap-northeast-1.amazonaws.com" } }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "lambda_nitro_api" {
  name              = "/${terraform.workspace}/46ki75/internal/cloudwatch/log_group/lambda_nitro_api"
  retention_in_days = 30
}

resource "aws_lambda_function" "nitro_api" {
  function_name     = "${terraform.workspace}-46ki75-internal-lambda-function-nitro-api"
  role              = aws_iam_role.lambda_nitro_api.arn
  s3_bucket         = data.aws_s3_object.nitro_api.bucket
  s3_key            = data.aws_s3_object.nitro_api.key
  s3_object_version = data.aws_s3_object.nitro_api.version_id
  source_code_hash  = data.aws_s3_object.nitro_api.checksum_sha256
  handler           = "server/index.handler"
  runtime           = "nodejs24.x"
  architectures     = ["arm64"]
  memory_size       = 512
  timeout           = 30
  publish           = true
  depends_on        = [aws_iam_role_policy.lambda_nitro_api]

  lifecycle {
    precondition {
      condition     = !contains(["", "null"], coalesce(data.aws_s3_object.nitro_api.version_id, "null"))
      error_message = "Nitro requires a versioned artifact. Run mise run nitro-api:bootstrap <stage>, then nitro-api:publish <stage>."
    }
    precondition {
      condition     = can(regex("^[A-Za-z0-9+/]{43}=$", data.aws_s3_object.nitro_api.checksum_sha256))
      error_message = "Publish Nitro with mise run nitro-api:publish <stage> to supply a full-object SHA-256 checksum."
    }
  }

  environment {
    variables = { STAGE_NAME = terraform.workspace, NODE_OPTIONS = "--enable-source-maps" }
  }
  logging_config {
    log_group             = aws_cloudwatch_log_group.lambda_nitro_api.name
    log_format            = "JSON"
    application_log_level = "INFO"
    system_log_level      = "INFO"
  }
}

resource "aws_lambda_alias" "nitro_api" {
  name             = "stable"
  function_name    = aws_lambda_function.nitro_api.function_name
  function_version = aws_lambda_function.nitro_api.version
}

resource "aws_apigatewayv2_integration" "nitro_api" {
  api_id                 = aws_apigatewayv2_api.backend.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.nitro_api.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

resource "aws_apigatewayv2_route" "nitro_api" {
  for_each           = local.nitro_api_routes
  api_id             = aws_apigatewayv2_api.backend.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.nitro_api.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.backend.id
}

resource "aws_lambda_permission" "apigwv2_nitro_api" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_alias.nitro_api.function_name
  qualifier     = aws_lambda_alias.nitro_api.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*/*"
}

resource "aws_lambda_permission" "nitro_logs_reporter" {
  statement_id   = "AllowExecutionFromNitroLogs"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.reporter.function_name
  principal      = "logs.amazonaws.com"
  source_arn     = "${aws_cloudwatch_log_group.lambda_nitro_api.arn}:*"
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_cloudwatch_log_subscription_filter" "nitro_api" {
  for_each = toset(["WARN", "ERROR"])
  # The reporter selects its SNS topic from the _warn / _error suffix.
  name            = "${terraform.workspace}-nitro-api_${lower(each.value)}"
  log_group_name  = aws_cloudwatch_log_group.lambda_nitro_api.name
  filter_pattern  = "{$.level=\"${each.value}\"}"
  destination_arn = aws_lambda_function.reporter.arn
  depends_on      = [aws_lambda_permission.nitro_logs_reporter]
}

resource "aws_cloudwatch_metric_alarm" "lambda_nitro_api" {
  alarm_name          = "${terraform.workspace}-46ki75-internal-cloudwatch-alarm-lambda-nitro-api"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.nitro_api.function_name }
  period              = 60
  evaluation_periods  = 1
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.error.arn]
  treat_missing_data  = "notBreaching"
}
