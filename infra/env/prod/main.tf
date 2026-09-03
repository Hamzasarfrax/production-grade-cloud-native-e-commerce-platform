terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.3"
}

# VPC Module
module "vpc" {
  source      = "../../module/vpc"
  name        = var.project_name
  region      = var.region
  environment = var.environment
  cidr        = var.vpc_cidr
}

# EKS Module
module "eks" {
  source                 = "../../module/eks"
  cluster_name           = "${var.project_name}-${var.environment}"
  environment            = var.environment
  kubernetes_version     = var.kubernetes_version
  public_subnets         = module.vpc.public_subnets
  private_subnets       = module.vpc.private_subnets
  eks_security_group_id  = module.vpc.eks_nodes_security_group_id
  node_instance_type     = var.node_instance_type
  node_desired_size      = var.node_desired_size
  node_min_size          = var.node_min_size
  node_max_size          = var.node_max_size
  node_disk_size         = var.node_disk_size
  log_retention_days     = var.log_retention_days
  public_access_cidrs    = var.public_access_cidrs
}

# RDS Module
module "rds" {
  source                      = "../../module/rds"
  environment                 = var.environment
  database_identifier         = "${var.project_name}-${var.environment}-mysql"
  database_name               = var.database_name
  database_username           = var.database_username
  engine_version              = var.mysql_engine_version
  instance_class              = var.rds_instance_class
  allocated_storage           = var.rds_allocated_storage
  storage_type                = var.rds_storage_type
  multi_az                    = var.rds_multi_az
  backup_retention_period     = var.rds_backup_retention
  backup_window               = var.rds_backup_window
  maintenance_window          = var.rds_maintenance_window
  skip_final_snapshot         = var.rds_skip_final_snapshot
  performance_insights_enabled = var.rds_performance_insights
  deletion_protection         = var.rds_deletion_protection
  db_subnet_group_name        = module.vpc.db_subnet_group_name
  db_security_group_id        = module.vpc.rds_security_group_id
  parameter_group_family      = var.mysql_parameter_group_family
  db_parameters               = var.mysql_parameters
  log_retention_days          = var.log_retention_days
  iops                        = var.rds_iops
}
