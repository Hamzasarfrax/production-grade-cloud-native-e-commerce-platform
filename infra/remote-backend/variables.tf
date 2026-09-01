variable "s3_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform remote state."
  type        = string
  default     = "remote-backed-s3-bucket"
}

variable "region" {
  description = "AWS region for the state bucket, lock table and KMS key."
  type        = string
  default     = "us-east-1"
}

variable "env" {
  description = "Environment name used for tagging resources."
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Additional tags to apply to backend resources."
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
  }
}
