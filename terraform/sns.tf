resource "aws_sns_topic" "error" {
  name = "${terraform.workspace}-46ki75-internal-sns-topic-error"
}

resource "aws_sns_topic_subscription" "error_email" {
  topic_arn = aws_sns_topic.error.arn
  protocol  = "email"
  endpoint  = "46ki75@gmail.com"
}
