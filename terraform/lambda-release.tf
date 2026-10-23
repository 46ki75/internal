variable "lambda_green_bootstrap_versions" {
  description = "Published versions used when creating green aliases. During migration, pin each currently live version, not a pending release. Later promotions and rollbacks belong to the release CLI."
  type        = map(string)
  default     = {}
  nullable    = false

  validation {
    condition = alltrue([
      for function in keys(var.lambda_green_bootstrap_versions) : contains(["http-api", "logs-reporter", "nitro-api"], function)
    ])
    error_message = "Bootstrap version keys must be http-api, logs-reporter, or nitro-api."
  }

  validation {
    condition = alltrue([
      for version in values(var.lambda_green_bootstrap_versions) : can(regex("^[1-9][0-9]*$", version))
    ])
    error_message = "Bootstrap versions must be positive integer strings identifying published Lambda versions, never $LATEST."
  }
}
