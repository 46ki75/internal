resource "aws_sns_topic" "error" {
  name = "${terraform.workspace}-46ki75-internal-sns-topic-error"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "*"
        },
        "Action" : "sns:Publish",
        "Resource" : "*",
        "Condition" : {
          "ArnLike" : {
            "aws:SourceArn" : "arn:aws:cloudwatch:ap-northeast-1:${data.aws_caller_identity.current.account_id}:alarm:*"
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "error_email" {
  topic_arn = aws_sns_topic.error.arn
  protocol  = "email"
  endpoint  = "46ki75@gmail.com"
}

resource "aws_sns_topic" "warn" {
  name = "${terraform.workspace}-46ki75-internal-sns-topic-warn"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "*"
        },
        "Action" : "sns:Publish",
        "Resource" : "*",
        "Condition" : {
          "ArnLike" : {
            "aws:SourceArn" : "arn:aws:cloudwatch:ap-northeast-1:${data.aws_caller_identity.current.account_id}:alarm:*"
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "warn_email" {
  topic_arn = aws_sns_topic.warn.arn
  protocol  = "email"
  endpoint  = "46ki75@gmail.com"
}

resource "aws_sns_topic" "info" {
  name = "${terraform.workspace}-46ki75-internal-sns-topic-info"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "*"
        },
        "Action" : "sns:Publish",
        "Resource" : "*",
        "Condition" : {
          "ArnLike" : {
            "aws:SourceArn" : "arn:aws:cloudwatch:ap-northeast-1:${data.aws_caller_identity.current.account_id}:alarm:*"
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "info_email" {
  topic_arn = aws_sns_topic.info.arn
  protocol  = "email"
  endpoint  = "46ki75@gmail.com"
}
