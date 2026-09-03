output "db_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_instance_address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Database master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_password_secret_id" {
  description = "Secrets Manager secret ID for database password"
  value       = aws_secretsmanager_secret.db_password.id
}

output "db_password_secret_arn" {
  description = "Secrets Manager secret ARN for database password"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "parameter_group_name" {
  description = "RDS parameter group name"
  value       = aws_db_parameter_group.main.name
}

output "db_security_group_id" {
  description = "RDS security group ID"
  value       = var.db_security_group_id
}
