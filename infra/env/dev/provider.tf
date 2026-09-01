provider "aws" {
  region = var.region
  # localStack ke liye endpoint override (real AWS ke liye comment kar do)
  # endpoint = "http://localhost:4566"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}
