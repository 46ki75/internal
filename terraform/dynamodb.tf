resource "aws_dynamodb_table" "default" {
  name           = "${terraform.workspace}-46ki75-internal-dynamodb-table"
  billing_mode   = "PROVISIONED"
  read_capacity  = 3
  write_capacity = 3
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  ttl {
    attribute_name = "_TTL"
    enabled        = true
  }
}
