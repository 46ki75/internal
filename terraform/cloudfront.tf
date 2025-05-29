resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${terraform.workspace}-46ki75-internal-cloudfront-oac-web"
  description                       = "Frontend S3 OAC"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "s3" {
  name = "${terraform.workspace}-46ki75-web-cloudfront-cache_policy-s3"

  default_ttl = 3600 * 24 * 30 * 6  # 6  [Month]
  min_ttl     = 3600 * 24 * 30 * 1  # 1  [Month]
  max_ttl     = 3600 * 24 * 30 * 12 # 12 [Month]

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

resource "aws_cloudfront_cache_policy" "disabled" {
  name = "${terraform.workspace}-46ki75-web-cloudfront-cache_policy-disabled"

  default_ttl = 0
  min_ttl     = 0
  max_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_origin_request_policy" "all_viewer" {

  name = "${terraform.workspace}-46ki75-internal-cloudfront-origin_request_policy-all_viewer"

  cookies_config {
    cookie_behavior = "all"
  }
  headers_config {
    header_behavior = "allExcept"
    headers {
      items = ["Host"]
    }
  }
  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_response_headers_policy" "default" {

  name = "${terraform.workspace}-46ki75-internal-cloudfront-response_headers_policy-web"

  security_headers_config {

    strict_transport_security {
      override                   = true
      access_control_max_age_sec = 31536000
      include_subdomains         = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      override     = true
      frame_option = "SAMEORIGIN"
    }

    xss_protection {
      override   = true
      mode_block = true
      protection = true
    }

    referrer_policy {
      override        = true
      referrer_policy = "no-referrer"
    }
  }
}

resource "aws_cloudfront_distribution" "default" {
  depends_on = [aws_acm_certificate.cloudfront_cert]

  http_version = "http2and3"
  enabled      = true

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  default_root_object = "index.html"

  # >>> custom domain
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  aliases = [aws_acm_certificate.cloudfront_cert.domain_name]
  # <<< custom domain

  # >>> [S3 web] origin
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

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rename_uri.arn
    }

    cache_policy_id            = aws_cloudfront_cache_policy.s3.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.all_viewer.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.default.id

    compress = true
  }

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "s3-web"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }
  # <<< [S3 web] origin

  # >>> [API GW] origin
  ordered_cache_behavior {
    path_pattern = "/api/graphql"
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

    cache_policy_id            = aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.all_viewer.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.default.id

    compress = true
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
  # <<< [API GW] origin


  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/403.html"
    error_caching_min_ttl = 0
  }
}


# >>> CloudFront Function
resource "aws_cloudfront_function" "rename_uri" {
  name    = "${terraform.workspace}-46ki75-cloudfront-internal-function-rename-uri"
  runtime = "cloudfront-js-2.0"
  comment = "Rename URI to index.html"
  publish = true
  code    = file("./assets/renameUri.js")
}
# <<< CloudFront Function

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
