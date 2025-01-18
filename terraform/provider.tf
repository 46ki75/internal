terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.76"
    }
  }


  # When using a non-default workspace, the state path will be `<workspace_key_prefix>/<workspace_name>/<key>`
  # @see https://developer.hashicorp.com/terraform/language/backend/s3#key
  # RUN: terraform workspace show
  # RUN: terraform workspace list
  # RUN: terraform workspace select dev
  backend "s3" {
    bucket               = "shared-46ki75-internal-s3-bucket-terraform-tfstate"
    workspace_key_prefix = "workspace"
    key                  = "terraform.tfstate"
    region               = "ap-northeast-1"
    encrypt              = true
    use_lockfile         = true
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

locals {
  environments = ["dev", "stg", "prod"]
}

resource "null_resource" "validate_workspace" {
  lifecycle {
    postcondition {
      condition     = contains(local.environments, terraform.workspace)
      error_message = "Invalid workspace. Available workspaces: ${join(", ", local.environments)}"
    }
  }
}


// @see https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity
data "aws_caller_identity" "current" {}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "caller_arn" {
  value = data.aws_caller_identity.current.arn
}

output "caller_user" {
  value = data.aws_caller_identity.current.user_id
}
