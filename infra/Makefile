.PHONY: help init plan apply destroy clean validate fmt refresh

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Variables
ENVIRONMENT ?= dev
REGION ?= us-east-1
PROJECT_NAME ?= mxmobilz

help:
	@echo "$(GREEN)Terraform Makefile for Mxmobilz Infrastructure$(NC)"
	@echo ""
	@echo "Usage: make [target] ENVIRONMENT=dev|stag|prod"
	@echo ""
	@echo "Targets:"
	@echo "  $(YELLOW)init$(NC)              Initialize Terraform backend and environments"
	@echo "  $(YELLOW)plan$(NC)              Plan infrastructure changes"
	@echo "  $(YELLOW)apply$(NC)             Apply infrastructure changes"
	@echo "  $(YELLOW)destroy$(NC)           Destroy infrastructure"
	@echo "  $(YELLOW)refresh$(NC)           Refresh Terraform state"
	@echo "  $(YELLOW)validate$(NC)          Validate Terraform configuration"
	@echo "  $(YELLOW)fmt$(NC)               Format Terraform code"
	@echo "  $(YELLOW)output$(NC)            Show Terraform outputs"
	@echo "  $(YELLOW)status$(NC)            Show infrastructure status"
	@echo "  $(YELLOW)clean$(NC)             Clean Terraform cache"
	@echo "  $(YELLOW)help$(NC)              Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make plan ENVIRONMENT=dev"
	@echo "  make apply ENVIRONMENT=staging"
	@echo "  make destroy ENVIRONMENT=prod"

init:
	@echo "$(GREEN)🚀 Initializing Terraform backend...$(NC)"
	@chmod +x scripts/init.sh
	@./scripts/init.sh

init-env:
	@echo "$(GREEN)🌍 Initializing $(ENVIRONMENT) environment...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform init

plan:
	@echo "$(GREEN)📋 Planning $(ENVIRONMENT) infrastructure...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform plan -out=tfplan

apply:
	@echo "$(GREEN)🚀 Applying $(ENVIRONMENT) infrastructure...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform apply tfplan

apply-auto:
	@echo "$(GREEN)🚀 Applying $(ENVIRONMENT) infrastructure (auto-approve)...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform apply -auto-approve

destroy:
	@echo "$(RED)⚠️  Destroying $(ENVIRONMENT) infrastructure...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform destroy

destroy-auto:
	@echo "$(RED)⚠️  Destroying $(ENVIRONMENT) infrastructure (auto-approve)...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform destroy -auto-approve

refresh:
	@echo "$(GREEN)🔄 Refreshing $(ENVIRONMENT) state...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform refresh

validate:
	@echo "$(GREEN)✔️  Validating $(ENVIRONMENT) configuration...$(NC)"
	@cd env/$(ENVIRONMENT) && terraform validate
	@echo "$(GREEN)✅ Configuration is valid$(NC)"

fmt:
	@echo "$(GREEN)🎨 Formatting Terraform code...$(NC)"
	@terraform fmt -recursive module/
	@terraform fmt -recursive env/
	@echo "$(GREEN)✅ Code formatted$(NC)"

output:
	@echo "$(GREEN)📊 Terraform outputs for $(ENVIRONMENT):$(NC)"
	@cd env/$(ENVIRONMENT) && terraform output

status:
	@echo "$(GREEN)📊 Infrastructure status for $(ENVIRONMENT):$(NC)"
	@cd env/$(ENVIRONMENT) && \
	echo "Resources: $$(terraform state list | wc -l)" && \
	terraform output -json 2>/dev/null | jq -r 'keys[]' || true

clean:
	@echo "$(YELLOW)🧹 Cleaning Terraform cache...$(NC)"
	@find . -name ".terraform" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.tfstate*" -type f -delete 2>/dev/null || true
	@find . -name ".terraform.lock.hcl" -type f -delete 2>/dev/null || true
	@find . -name "tfplan" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✅ Cache cleaned$(NC)"

.PHONY: backend-destroy
backend-destroy:
	@echo "$(RED)⚠️  Destroying Terraform backend...$(NC)"
	@cd remote-backend && terraform destroy
	@echo "$(RED)⚠️  Don't forget to manually delete S3 buckets and DynamoDB table$(NC)"

# Help all environments
plan-all:
	@for env in dev stag prod; do \
		echo "$(GREEN)📋 Planning $$env...$(NC)"; \
		cd env/$$env && terraform plan && cd ../..; \
	done

apply-all:
	@echo "$(RED)⚠️  This will apply to all environments!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " response; \
	if [ "$$response" = "yes" ]; then \
		for env in dev stag prod; do \
			echo "$(GREEN)🚀 Applying $$env...$(NC)"; \
			cd env/$$env && terraform apply -auto-approve && cd ../..; \
		done; \
	fi

# Get kubectl config
kubectl-config:
	@echo "$(GREEN)🔧 Configuring kubectl for $(ENVIRONMENT)...$(NC)"
	@cd env/$(ENVIRONMENT) && \
	CLUSTER_ID=$$(terraform output -raw eks_cluster_id 2>/dev/null) && \
	aws eks update-kubeconfig --region $(REGION) --name $$CLUSTER_ID && \
	echo "$(GREEN)✅ kubectl configured$(NC)" && \
	kubectl get nodes

# Get database credentials
db-creds:
	@echo "$(GREEN)🔐 Database credentials for $(ENVIRONMENT):$(NC)"
	@cd env/$(ENVIRONMENT) && \
	echo "Address: $$(terraform output -raw rds_address 2>/dev/null)" && \
	echo "Port: $$(terraform output -raw rds_port 2>/dev/null)" && \
	echo "Database: $$(terraform output -raw rds_database_name 2>/dev/null)" && \
	echo "Username: admin" && \
	echo "Password: $$(aws secretsmanager get-secret-value --secret-id $$(terraform output -raw rds_password_secret_id 2>/dev/null) --query 'SecretString' --output text 2>/dev/null | jq -r '.password' 2>/dev/null || echo 'FAILED TO RETRIEVE')"

# View logs
logs-eks:
	@echo "$(GREEN)📊 EKS cluster logs for $(ENVIRONMENT):$(NC)"
	@aws logs tail /aws/eks/$(PROJECT_NAME)-$(ENVIRONMENT)/cluster --follow --region $(REGION)

logs-rds:
	@echo "$(GREEN)📊 RDS logs for $(ENVIRONMENT):$(NC)"
	@aws logs tail /aws/rds/mysql/$(PROJECT_NAME)-$(ENVIRONMENT)-mysql/error --follow --region $(REGION)

# Cost estimation
cost:
	@echo "$(YELLOW)💰 Estimated monthly costs for $(ENVIRONMENT):$(NC)"
	@echo "  Dev: ~$30-50"
	@echo "  Staging: ~$100-150"
	@echo "  Prod: ~$200-300"
	@echo ""
	@echo "Note: Actual costs depend on traffic and resource usage"

.DEFAULT_GOAL := help
