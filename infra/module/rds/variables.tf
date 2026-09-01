variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "database_identifier" {
  description = "RDS instance identifier"
  type        = string
  default     = "mxmobilz-mysql"
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "mxmobilz_db"
}

variable "database_username" {
  description = "Master username for the database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "storage_type" {
  description = "Storage type (gp2, gp3, io1)"
  type        = string
  default     = "gp3"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying"
  type        = bool
  default     = false
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "db_subnet_group_name" {
  description = "DB subnet group name"
  type        = string
}

variable "db_security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "8.0"
}

variable "db_parameters" {
  description = "Database parameters"
  type        = map(string)
  default = {
    "character_set_server" = "utf8mb4"
    "collation_server"     = "utf8mb4_unicode_ci"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "iops" {
  description = "IOPS for gp3 storage"
  type        = number
  default     = 3000
}
