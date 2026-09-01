# Remote state bootstrap ke liye real AWS — koi LocalStack override nahi.
provider "aws" {
  region = var.region
}
