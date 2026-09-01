terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Generate random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Secrets Manager secret for database password
resource "aws_secretsmanager_secret" "db_password" {
  name_prefix             = "${var.database_name}-password-"
  description             = "RDS database password for ${var.database_name}"
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
    Database    = var.database_name
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.database_username
    password = random_password.db_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.database_name
  })
}

# RDS instance
resource "aws_db_instance" "main" {
  identifier                      = var.database_identifier
  engine                          = "mysql"
  engine_version                  = var.engine_version
  instance_class                  = var.instance_class
  allocated_storage               = var.allocated_storage
  storage_type                    = var.storage_type
  storage_encrypted               = true
  db_name                         = var.database_name
  username                        = var.database_username
  password                        = random_password.db_password.result
  db_subnet_group_name            = var.db_subnet_group_name
  vpc_security_group_ids          = [var.db_security_group_id]
  publicly_accessible             = false
  multi_az                        = var.multi_az
  backup_retention_period         = var.backup_retention_period
  backup_window                   = var.backup_window
  maintenance_window              = var.maintenance_window
  copy_tags_to_snapshot           = true
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  skip_final_snapshot             = var.skip_final_snapshot
  final_snapshot_identifier       = var.skip_final_snapshot ? null : "${var.database_identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  performance_insights_enabled    = var.performance_insights_enabled
  deletion_protection             = var.deletion_protection
  iops                            = var.iops

  tags = {
    Name        = var.database_identifier
    Environment = var.environment
  }

  # NOTE: secret version ke andar instance ke attributes (host/port) reference
  # hote hain, isliye instance -> secret ki implicit dependency hi correct order
  # deti hai. Explicit depends_on yahan circular dependency banata tha:
  #   aws_db_instance.main -> secret_version -> aws_db_instance.main
  # (terraform validate isko "Cycle" error deta fail karta tha.)
}

# Database parameter group
resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.database_identifier}-"
  family      = "mysql${var.parameter_group_family}"
  description = "Parameter group for ${var.database_identifier}"

  dynamic "parameter" {
    for_each = var.db_parameters
    content {
      name         = parameter.key
      value        = parameter.value
      apply_method = "immediate"
    }
  }

  tags = {
    Name        = "${var.database_identifier}-params"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Enhanced monitoring IAM role
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${var.database_identifier}-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.rds_monitoring.name
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "rds_error" {
  name              = "/aws/rds/mysql/${var.database_identifier}/error"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "rds_slowquery" {
  name              = "/aws/rds/mysql/${var.database_identifier}/slowquery"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
  }
}
