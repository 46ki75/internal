resource "aws_acm_certificate" "cloudfront_cert" {
  provider = aws.us-east-1 # us-east-1

  domain_name       = terraform.workspace == "prod" ? "internal.46ki75.com" : "${terraform.workspace}.internal.46ki75.com"
  validation_method = "DNS"
}

resource "aws_route53_record" "cloudfront_cert_validation" {
  provider = aws.us-east-1 # us-east-1

  for_each = {
    for dvo in aws_acm_certificate.cloudfront_cert.domain_validation_options :
    dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.internal.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cloudfront_cert_cert" {
  provider = aws.us-east-1 # us-east-1

  certificate_arn = aws_acm_certificate.cloudfront_cert.arn
  validation_record_fqdns = [
    for record in aws_route53_record.cloudfront_cert_validation :
    record.fqdn
  ]
}
