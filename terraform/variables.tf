variable "environment" {
  description = "The environment to deploy to"
  type        = string

  validation {
    condition     = contains(["dev", "stg", "prod"], var.environment)
    error_message = "Environment must be one of 'dev', 'stg', or 'prod'."
  }
}
