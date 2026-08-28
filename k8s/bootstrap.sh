#!/usr/bin/env bash
###############################################################################
# Mxmobilz Production-Style K8s Bootstrap
#
# YE SCRIPT KYA KARTA HAI:
#   1. Docker availability check (WSL integration)
#   2. Purana kind cluster delete + fresh production config se create
#   3. Namespace + Secret apply
#   4. Images ko kind nodes me load (imagePullBackOff se bachne ke liye)
#   5. MySQL (StatefulSet) deploy + ready hone ka wait
#   6. Backend (Helm chart) deploy — DB env secret se milte hain
#   7. Frontend deploy
#   8. Nginx Ingress controller install
#   9. Ingress + verification
#
# RUN:  bash k8s/bootstrap.sh
###############################################################################

set -euo pipefail

NAMESPACE="cloud-native-ecomerce-app"
CLUSTER_NAME="mxmobilz-prod"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# MySQL image — join backend + frontend image
MYSQL_IMAGE="mysql:8.0"
BACKEND_IMAGE="hamzasarfraz862/backend-app:1.0.0"
FRONTEND_IMAGE="hamzasarfraz862/front-end-app:1.0.0"

echo ""
echo "=========================================================="
echo " MXMOBILZ — Production-Style K8s Bootstrap"
echo "=========================================================="
echo ""

# ---------------------------------------------------------------
# STEP 1: Docker check
# ---------------------------------------------------------------
echo "[1/9] Checking Docker engine..."
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker engine accessible nahi hai."
  echo "WSL mein hai to yahan se try karo:"
  echo "  Docker Desktop > Settings > Resources > WSL Integration"
  echo "  apna WSL distro ON karo, phir is script ko dubara chalao."
  exit 1
fi
echo "      Docker OK: $(docker info --format '{{.ServerVersion}}')"
echo ""

# ---------------------------------------------------------------
# STEP 2: Clean old cluster (agar ho)
# ---------------------------------------------------------------
echo "[2/9] Cleaning old kind clusters (agar exist karein)..."
for c in $(kind get clusters 2>/dev/null); do
  echo "      Deleting stale cluster: $c"
  kind delete cluster --name "$c" || true
done
echo ""

# ---------------------------------------------------------------
# STEP 3: Create fresh production cluster
# ---------------------------------------------------------------
echo "[3/9] Creating kind cluster '$CLUSTER_NAME' (production config)..."
kind create cluster --config "$K8S_DIR/kind.yaml"
echo ""

# ---------------------------------------------------------------
# STEP 4: Namespace + Secret
# ---------------------------------------------------------------
echo "[4/9] Creating namespace + database secret..."
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/mysql/mysql-secret.yaml"
echo ""

# ---------------------------------------------------------------
# STEP 5: Load images into kind nodes
#    - Kind nodes Docker daemon use karte hain, image registry pe nahi
#    - Agar image pull ho jaye to n/w access nahi hota isliye local load
#    - imagePullBucket pehle se present hai -> local image use hui
# ---------------------------------------------------------------
echo "[5/9] Loading container images into kind nodes..."
for img in "$MYSQL_IMAGE" "$BACKEND_IMAGE" "$FRONTEND_IMAGE"; do
  echo "      Loading $img ..."
  if docker image inspect "$img" >/dev/null 2>&1; then
    kind load docker-image "$img" --name "$CLUSTER_NAME"
  else
    echo "      WARN: $img locally nahi mili — DockerHub se pull hogi."
  fi
done
echo ""

# ---------------------------------------------------------------
# STEP 6: MySQL deploy + wait
# ---------------------------------------------------------------
echo "[6/9] Deploying MySQL (StatefulSet + PVC)..."
kubectl apply -f "$K8S_DIR/mysql/mysql-stack.yaml"
echo "      Waiting for MySQL pod to be Ready (max 180s)..."
kubectl wait --for=condition=Ready pod/mysql-0 -n "$NAMESPACE" --timeout=180s
echo ""

# ---------------------------------------------------------------
# STEP 7: Backend via Helm
# ---------------------------------------------------------------
echo "[7/9] Deploying Backend (Helm chart)..."
helm upgrade --install backend "$K8S_DIR/backend/backend-helm" \
  -n "$NAMESPACE" \
  --set image.repository=hamzasarfraz862/backend-app \
  --set image.tag=1.0.0 \
  --set replicaCount=3 \
  --wait --timeout 180s
echo ""

# ---------------------------------------------------------------
# STEP 8: Frontend deploy
# ---------------------------------------------------------------
echo "[8/9] Deploying Frontend..."
kubectl apply -f "$K8S_DIR/frontend/frontend-deployment.yaml"
echo ""

# ---------------------------------------------------------------
# STEP 9: Ingress controller + Ingress + verify
# ---------------------------------------------------------------
echo "[9/9] Installing NGINX Ingress controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/kind/deploy.yaml
echo "      Applying ingress rule..."
kubectl apply -f "$K8S_DIR/ingress/ingress.yaml"

echo "      Waiting for ingress controller pods..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s || echo "      (ingress wait timeout — aut pichhe check karo)"

echo ""
echo "=========================================================="
echo " DEPLOYMENT COMPLETE!"
echo "=========================================================="
echo ""
echo "Resources:"
kubectl get pods,svc -n "$NAMESPACE"
echo ""
echo "Verification:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs mysql-0 -n $NAMESPACE"
echo ""
echo "Access via ingress (host mock):"
echo "  echo '127.0.0.1 mxmobilz.local' >> /etc/hosts"
echo "  curl -H 'Host: mxmobilz.local' http://localhost/api/products"
echo ""
echo "NOTE: MySQL data PVC pe persistent hai — pod delete hone par bhi data safe."
echo "Done."



# Frontend:

# kubectl port-forward svc/frontend-service 3000:80 -n cloud-native-ecomerce-app &

# Phir browser:

# http://localhost:3000

# Backend:

# kubectl port-forward svc/backend-backend-helm 8000:8000 -n cloud-native-ecomerce-app &

# Phir test:

# http://localhost:8000/api/products





# kubectl get pods -n cloud-native-ecomerce-app
# kubectl get pvc -n cloud-native-ecomerce-app
# kubectl get svc -n cloud-native-ecomerce-app