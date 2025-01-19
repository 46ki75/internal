data "aws_route53_zone" "internal" {
  # name = "internal.46ki75.com"
  name = terraform.workspace == "prod" ? "internal.46ki75.com" : terraform.workspace == "stg" ? "stg-internal.46ki75.com" : "dev-internal.46ki75.com"
}
