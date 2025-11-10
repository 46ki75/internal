resource "aws_s3_bucket" "web" {
  bucket = "${terraform.workspace}-46ki75-internal-s3-bucket-web"
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.web.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "${aws_cloudfront_distribution.default.arn}"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket" "tts" {
  bucket = "${terraform.workspace}-46ki75-internal-s3-bucket-tts"
}
