terraform {
  backend "s3" {
    bucket = "mxmobilz-terraform-state-prod"

    key = "dev/terraform.tfstate"

    region = "ap-south-1"

    encrypt = true

    use_lockfile = true
  }
}