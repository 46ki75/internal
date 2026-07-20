resource "aws_iam_user" "jcode_cloudwatch" {
  name = "${terraform.workspace}-jcode-cloudwatch"
}

resource "aws_iam_policy" "jcode_cloudwatch" {
  name        = "${terraform.workspace}-jcode-cloudwatch"
  description = "Allow jcode-cloudwatch to publish metrics"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "PublishLlmMetrics"
        Effect   = "Allow"
        Action   = "cloudwatch:PutMetricData"
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "LLM"
          }
        }
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "jcode_cloudwatch" {
  user       = aws_iam_user.jcode_cloudwatch.name
  policy_arn = aws_iam_policy.jcode_cloudwatch.arn
}

output "jcode_cloudwatch_user_name" {
  value = aws_iam_user.jcode_cloudwatch.name
}

output "jcode_cloudwatch_policy_arn" {
  value = aws_iam_policy.jcode_cloudwatch.arn
}
