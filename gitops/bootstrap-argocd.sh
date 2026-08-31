#!/usr/bin/env bash
# ArgoCD Bootstrap Script for Mxmobilz
# Run this after Kind cluster is up and ArgoCD is installed

set -euo pipefail

echo "=== Mxmobilz ArgoCD Bootstrap ==="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Cannot connect to Kubernetes cluster. Is Kind running?${NC}"
    exit 1
fi

echo -e "${GREEN}Cluster connection OK${NC}"

# 1. Install ArgoCD if not present
if ! kubectl get namespace argocd &> /dev/null; then
    echo -e "${YELLOW}Installing ArgoCD...${NC}"
    kubectl create namespace argocd
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    
    echo -e "${YELLOW}Waiting for ArgoCD pods to be ready...${NC}"
    kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
else
    echo -e "${GREEN}ArgoCD namespace already exists${NC}"
fi

# 2. Get ArgoCD admin password
echo -e "${YELLOW}ArgoCD Admin Password:${NC}"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d
echo ""

# 3. Apply ArgoCD Project
echo -e "${YELLOW}Applying ArgoCD Project...${NC}"
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml

# 4. Apply Root Application (App of Apps)
echo -e "${YELLOW}Applying Root Application (App of Apps)...${NC}"
kubectl apply -f gitops/argocd/applications/root-application.yaml

# 5. Wait for root app to sync and create child apps
echo -e "${YELLOW}Waiting for Root Application to sync...${NC}"
sleep 5

# 6. Show status
echo -e "${GREEN}=== ArgoCD Applications Status ===${NC}"
kubectl get applications -n argocd

echo -e "${GREEN}=== Done! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Access ArgoCD UI: kubectl port-forward -n argocd svc/argocd-server 8080:443"
echo "2. Open https://localhost:8080 (user: admin, password shown above)"
echo "3. Click each application (mxmobilz-dev, mxmobilz-staging, mxmobilz-prod) and press SYNC"
echo "4. Verify deployments: kubectl get pods -n cloud-native-ecomerce-dev/staging/prod"