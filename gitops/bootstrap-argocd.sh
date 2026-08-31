#!/usr/bin/env bash
# Simple ArgoCD Bootstrap for Mxmobilz

set -euo pipefail

echo "=== Mxmobilz ArgoCD Simple Bootstrap ==="

# Check cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "Cluster OK"

# 1. Install ArgoCD if needed
if ! kubectl get namespace argocd &> /dev/null; then
    echo "Installing ArgoCD..."
    kubectl create namespace argocd
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    echo "Waiting for ArgoCD..."
    kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
else
    echo "ArgoCD already installed"
fi

# 2. Show admin password
echo ""
echo "ArgoCD Admin Password:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d
echo ""

# 3. Apply GitOps manifests
echo "Applying ArgoCD Project..."
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml

echo "Applying Root Application (App of Apps)..."
kubectl apply -f gitops/argocd/applications/root-application.yaml

echo ""
echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "1. Access ArgoCD UI: kubectl port-forward -n argocd svc/argocd-server 8080:443"
echo "2. Open https://localhost:8080 (user: admin, password above)"
echo "3. Click each app (mxmobilz-dev, mxmobilz-staging, mxmobilz-prod) and press SYNC"
echo "4. Verify: kubectl get pods -n cloud-native-ecomerce-dev/staging/prod"