resource "aws_ecr_repository" "ag-ui-server" {
  name                 = "${terraform.workspace}/ag-ui-server"
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
        # Subscription auth: the Claude Agent SDK reaches Anthropic directly with
        # a `claude setup-token` OAuth token read from this SSM SecureString at
        # startup (no Bedrock model invocation is used).
        Sid    = "ReadModelSecret"
        Effect = "Allow"
        Action = ["ssm:GetParameter"]
        Resource = [
          "arn:aws:ssm:ap-northeast-1:${data.aws_caller_identity.current.account_id}:parameter/${terraform.workspace}/46ki75/internal/claude-code/secret"
        ]
      },
      {
        # That parameter is a SecureString; decrypting it needs kms:Decrypt on the
        # key that encrypted it. Scope the grant to calls made through SSM in the
        # secret's region rather than naming a specific key ARN.
        Sid      = "DecryptModelSecret"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = ["*"]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.ap-northeast-1.amazonaws.com"
          }
        }
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

  environment_variables = {
    # The OAuth token itself is never passed here; the runtime reads it from SSM
    # (SecureString) at startup using the param name/region below.
    "CLAUDE_CODE_OAUTH_TOKEN_PARAM"  = "/${terraform.workspace}/46ki75/internal/claude-code/secret"
    "CLAUDE_CODE_OAUTH_TOKEN_REGION" = "ap-northeast-1"
    "MODEL_ID"                       = "claude-sonnet-4-6"
    "MCP_URL"                        = "https://knowledge-mcp.global.api.aws"
  }

  # The container reads the model secret from SSM at startup, so the execution
  # role must already grant ssm:GetParameter + kms:Decrypt before a new runtime
  # version's container boots. Force the policy/attachment to update first; a new
  # IAM statement can still take a few seconds to propagate, so a container that
  # starts in that window may fail once and is replaced (AgentCore retries).
  depends_on = [
    aws_iam_policy.bedrock_agentcore_runtime_ag_ui_server,
    aws_iam_role_policy_attachment.bedrock_agentcore_runtime_ag_ui_server,
  ]
}

locals {
  ag_ui_server_domain   = "bedrock-agentcore.ap-northeast-1.amazonaws.com"
  ag_ui_server_path     = "/runtimes/${urlencode(aws_bedrockagentcore_agent_runtime.ag-ui-server.agent_runtime_arn)}/invocations"
  ag_ui_server_endpoint = "https://${local.ag_ui_server_domain}${local.ag_ui_server_path}?qualifier=DEFAULT"
}

output "ag_ui_server_endpoint" {
  value = local.ag_ui_server_endpoint
}
