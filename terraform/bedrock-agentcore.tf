resource "aws_ecr_repository" "ag-ui-server" {
  name                 = "ag-ui-server"
  image_tag_mutability = "MUTABLE"
}
