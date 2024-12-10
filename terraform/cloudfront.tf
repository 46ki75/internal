resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "web"
  description                       = "Frontend S3 OAC"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "default" {
  enabled = true

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # >>> custom domain
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  aliases = [aws_acm_certificate.cloudfront_cert.domain_name]
  # <<< custom domain

  default_cache_behavior {
    allowed_methods = [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT"
    ]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    target_origin_id       = "s3-web"

    default_ttl = 3600 * 24 * 30
    min_ttl     = 0
    max_ttl     = 3600 * 24 * 30 * 12

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["etag"]
    }
  }

  ordered_cache_behavior {
    path_pattern = "/graphql"
    allowed_methods = [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT"
    ]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    target_origin_id       = "api-backend"

    default_ttl = 0
    min_ttl     = 0
    max_ttl     = 0

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
      headers = ["Authorization"]
    }
  }


  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "s3-web"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  origin {
    domain_name = aws_apigatewayv2_domain_name.backend.domain_name
    origin_id   = "api-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_root_object = "index.html"
}

resource "aws_route53_record" "cloudfront" {
  zone_id = data.aws_route53_zone.internal.zone_id
  name    = aws_acm_certificate.cloudfront_cert.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.default.domain_name
    zone_id                = aws_cloudfront_distribution.default.hosted_zone_id
    evaluate_target_health = false
  }
}

output "cloudfront_url" {
  value = "https://${aws_route53_record.cloudfront.fqdn}"
}
