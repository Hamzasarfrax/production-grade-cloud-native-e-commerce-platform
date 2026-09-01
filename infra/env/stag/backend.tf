terraform {
  backend "s3" {
    bucket         = "mxmobilz-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "mxmobilz-terraform-locks"
  }
}
