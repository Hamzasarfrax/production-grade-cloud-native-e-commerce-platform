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
echo "Applying Ingress-Nginx..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
# for local kind
which kubectl
sudo setcap 'cap_net_bind_service=+ep' $(which kubectl)
getcap $(which kubectl)
# port forword 
sudo kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 80:80  &

echo "Applying ArgoCD Project..."
kubectl apply -f gitops/argocd/projects/mxmobilz-project.yaml

echo "Applying Root Application (App of Apps)..."
kubectl apply -f gitops/argocd/applications/root-application.yaml

echo "1. Access ArgoCD UI: kubectl port-forward -n argocd svc/argocd-server 8080:443 &"
echo ""
echo "=== Done! ==="
echo ""
echo "Next steps:"

echo "2. Open https://localhost:8080 (user: admin, password above)"
echo "3. Click each app (mxmobilz-dev, mxmobilz-staging, mxmobilz-prod) and press SYNC"
echo "4. Verify: kubectl get pods -n cloud-native-ecomerce-dev/staging/prod"

echo "Repo Add : helm repo add prometheus-community https://prometheus-community.github.io/helm-charts"

echo "Repo Update : helm repo update"


echo "kubectl create namespace monitoring"

echo "kubectl get ns monitoring "

echo "Install Prometheus : helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring"

  echo "kubectl get pods -n monitoring"

  echo "kubectl get svc -n monitoring"

  echo "Access Grafana Port forward : kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80 &"

    echo "Access Grafana Password : kubectl get secret -n monitoring monitoring-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d"

  echo "Open Grafana : http://localhost:3001 (user: admin, password: prom-operator)"
  echo "Add Prometheus Data Source in Grafana : kubectl port-forward -n monitoring \
  svc/monitoring-kube-prometheus-stack-prometheus 9090:9090"

