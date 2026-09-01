terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket         = "mxmobilz-terraform-state-prod"
    key            = "dev/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "remote-backed-s3-bucket-locks"
  }
}

provider "aws" {
  region     = var.region
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  skip_region_validation      = true
  s3_use_path_style           = true

  endpoints {
    s3 = "http://localhost:4566"
  }
}

module "vpc" {
  source  = "../../module/vpc"
  name    = var.project_name
  region  = var.region
  environment = var.environment
}