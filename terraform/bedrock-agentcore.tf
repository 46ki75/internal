resource "aws_ecr_repository" "ag-ui-server" {
  name                 = "ag-ui-server"
  image_tag_mutability = "MUTABLE"
}

# @see https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html
resource "aws_iam_role" "bedrock_agentcore_runtime_ag_ui_server" {
  name = "${terraform.workspace}-bedrock-agentcore-runtime-ag-ui-server"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRolePolicy"
        Effect = "Allow"
        Principal = {
          Service = "bedrock-agentcore.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:aws:bedrock-agentcore:ap-northeast-1:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "bedrock_agentcore_runtime_ag_ui_server" {
  name        = "${terraform.workspace}-bedrock-agentcore-runtime-ag-ui-server"
  description = "Execution policy for AgentCore Runtime ag-ui-server"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRImageAccess"
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = [aws_ecr_repository.ag-ui-server.arn]
      },
      {
        Sid      = "ECRTokenAccess"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogStreams",
          "logs:CreateLogGroup"
        ]
        Resource = [
          "arn:aws:logs:ap-northeast-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/bedrock-agentcore/runtimes/*"
        ]
      },
      {
        Effect = "Allow"
        Action = ["logs:DescribeLogGroups"]
        Resource = [
          "arn:aws:logs:ap-northeast-1:${data.aws_caller_identity.current.account_id}:log-group:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:ap-northeast-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets"
        ]
        Resource = ["*"]
      },
      {
        Effect   = "Allow"
        Action   = "cloudwatch:PutMetricData"
        Resource = ["*"]
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "bedrock-agentcore"
          }
        }
      },
      {
        Sid    = "GetAgentAccessToken"
        Effect = "Allow"
        Action = [
          "bedrock-agentcore:GetWorkloadAccessToken",
          "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
          "bedrock-agentcore:GetWorkloadAccessTokenForUserId"
        ]
        Resource = [
          "arn:aws:bedrock-agentcore:ap-northeast-1:${data.aws_caller_identity.current.account_id}:workload-identity-directory/default",
          "arn:aws:bedrock-agentcore:ap-northeast-1:${data.aws_caller_identity.current.account_id}:workload-identity-directory/default/workload-identity/${terraform.workspace}-46ki75-internal-ag-ui-server-*"
        ]
      },
      {
        Sid    = "BedrockModelInvocation"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:*::foundation-model/*",
          "arn:aws:bedrock:ap-northeast-1:${data.aws_caller_identity.current.account_id}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "bedrock_agentcore_runtime_ag_ui_server" {
  role       = aws_iam_role.bedrock_agentcore_runtime_ag_ui_server.name
  policy_arn = aws_iam_policy.bedrock_agentcore_runtime_ag_ui_server.arn
}


resource "aws_bedrockagentcore_agent_runtime" "ag-ui-server" {
  agent_runtime_name = "${terraform.workspace}_46ki75_internal_ag_ui_server"
  role_arn           = aws_iam_role.bedrock_agentcore_runtime_ag_ui_server.arn

  agent_runtime_artifact {
    container_configuration {
      container_uri = "${aws_ecr_repository.ag-ui-server.repository_url}:latest"
    }
  }

  authorizer_configuration {
    custom_jwt_authorizer {
      allowed_clients = [
        aws_cognito_user_pool_client.spa.id,
      ]
      discovery_url = "https://cognito-idp.ap-northeast-1.amazonaws.com/${aws_cognito_user_pool.default.id}/.well-known/openid-configuration"
    }
  }

  protocol_configuration {
    server_protocol = "AGUI"
  }

  network_configuration {
    network_mode = "PUBLIC"
  }
}

output "ag_ui_server_endpoint" {
  value = "https://bedrock-agentcore.ap-northeast-1.amazonaws.com/runtimes/${urlencode(aws_bedrockagentcore_agent_runtime.ag-ui-server.agent_runtime_arn)}/invocations?qualifier=DEFAULT"
}
