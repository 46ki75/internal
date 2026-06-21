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

  deletion_protection_enabled = true
}

# Mirrors Claude Agent SDK session transcripts for the ag-ui-server runtime so
# conversations (and subagent transcripts) can be resumed server-side. One item
# per transcript entry; pk = "<project_key>\x1f<session_id>" groups a whole
# session in one partition. Experimental: on-demand billing, TTL-swept, no
# deletion protection. See python/ag-ui-server/src/ag_ui_server/session_store.py.
resource "aws_dynamodb_table" "ag-ui-session" {
  name         = "${terraform.workspace}-46ki75-internal-dynamodb-table-ag-ui-session"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
