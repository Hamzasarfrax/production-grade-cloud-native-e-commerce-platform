# Terraform backend: real AWS S3 ko enable karo, ya localStack ke liye comment karo
terraform {
  # real AWS ke liye:
  # backend "s3" {
  #   bucket         = "mxmobilz-terraform-state-dev"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "mxmobilz-terraform-locks"
  # }

  # localStack ke liye:
  backend "local" {
    path = "../terraform.tfstate"
  }
}
