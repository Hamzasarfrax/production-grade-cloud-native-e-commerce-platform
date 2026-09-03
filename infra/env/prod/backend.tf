terraform {
  # real AWS ke liye:
  # backend "s3" {
  #   bucket         = "mxmobilz-terraform-state-prod"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "mxmobilz-terraform-locks"
  # }

  # localStack ke liye:
  backend "local" {
    path = "../../terraform.tfstate"
  }
}
}
