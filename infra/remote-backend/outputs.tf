output "s3_bucket_arn" {
  value       = aws_s3_bucket.remote_s3.arn
  description = "The ARN of the S3 bucket"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "The name of the DynamoDB table"
}

output "kms_key_arn" {
  value       = aws_kms_key.mykey-s3.arn
  description = "The ARN of the KMS key"
}
