resource "aws_acm_certificate" "api_cert" {
  domain_name       = "api.${data.aws_route53_zone.internal.name}"
  validation_method = "DNS"
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api_cert.domain_validation_options :
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

resource "aws_acm_certificate_validation" "api_cert" {
  certificate_arn = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [
    for record in aws_route53_record.api_cert_validation :
    record.fqdn
  ]
}
