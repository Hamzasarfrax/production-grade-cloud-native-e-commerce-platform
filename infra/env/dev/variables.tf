variable "project_name" {
  description = "Project name"
  type        = string
  default     = "mxmobilz"
}

variable "region" {
  description = "Us East 1"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}