# remote bucket

resource "aws_s3_bucket" "remote_s3" {
  bucket              = var.s3_bucket_name
  object_lock_enabled = true
  tags = merge(var.tags, {
    Name        = var.s3_bucket_name
    Environment = var.env
    Purpose     = "Terraform Remote State"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Bucket access logging for audit trails
resource "aws_s3_bucket" "log_bucket" {
  bucket        = "${var.s3_bucket_name}-logs"
  force_destroy = true # Logs bucket can be destroyed if needed, unlike the state bucket
}

# Secure the log bucket itself
resource "aws_s3_bucket_public_access_block" "log_bucket_access" {
  bucket                  = aws_s3_bucket.log_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_bucket_encryption" {
  bucket = aws_s3_bucket.log_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_logging" "backend_logging" {
  bucket        = aws_s3_bucket.remote_s3.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "log/"
}

resource "aws_s3_bucket_versioning" "versioning_enabled" {
  bucket = aws_s3_bucket.remote_s3.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Changed from account-level to bucket-level for better scoping
resource "aws_s3_bucket_public_access_block" "remote_s3_access" {
  bucket                  = aws_s3_bucket.remote_s3.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_object_lock_configuration" "object_lock_enabled" {
  bucket = aws_s3_bucket.remote_s3.id
  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 30
    }
  }
}


resource "aws_kms_key" "mykey-s3" {
  description             = "This key is used to encrypt bucket objects"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/terraform-remote-state-key"
  target_key_id = aws_kms_key.mykey-s3.key_id
}

resource "aws_s3_bucket_server_side_encryption_configuration" "enabled_encryption" {
  bucket = aws_s3_bucket.remote_s3.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.mykey-s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Added DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "${var.s3_bucket_name}-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }
}
