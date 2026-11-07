locals {
  base_domain_name = {
    dev  = "dev-internal.ikuma.cloud"
    stg  = "stg-internal.ikuma.cloud"
    prod = "internal.ikuma.cloud"
  }
}

data "aws_route53_zone" "internal" {
  name = local.base_domain_name[terraform.workspace]
}
