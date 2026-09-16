# ==============================================================================
# Step 1: Install kube-prometheus-stack (Helm)
# ==============================================================================
# Ye command sab kuch deploy karta hai:
# - Prometheus Operator + Prometheus
# - Grafana (with default dashboards)
# - Alertmanager
# - kube-state-metrics (K8s object metrics)
# - node-exporter (host metrics)
#
# Run from project root:
#   chmod +x monitoring/k8s/install.sh
#   ./monitoring/k8s/install.sh
# ==============================================================================

#!/bin/bash
set -e

echo "=== Step 1: Creating monitoring namespace ==="
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

echo "=== Step 2: Adding Helm repos ==="
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

echo "=== Step 3: Installing kube-prometheus-stack ==="
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set grafana.adminPassword=admin \
  --set grafana.adminUser=admin \
  --set prometheus.prometheusSpec.retention=15d \
  --set prometheus.prometheusSpec.scrapeInterval=15s \
  --set alertmanager.alertmanagerSpec.retention=120h \
  --wait --timeout 300s

echo "=== Step 4: Waiting for pods ==="
kubectl wait --for=condition=Ready pods --all -n monitoring --timeout=300s

echo "=== Step 5: Applying custom monitoring configs ==="
kubectl apply -f monitoring/k8s/grafana-dashboards-cm.yaml
kubectl apply -f monitoring/k8s/servicemonitor-backend.yaml
kubectl apply -f monitoring/k8s/servicemonitor-mysql.yaml
kubectl apply -f monitoring/k8s/prometheusrule-app-alerts.yaml
kubectl apply -f monitoring/k8s/prometheusrule-infra-alerts.yaml
kubectl apply -f monitoring/k8s/prometheusrule-mysql-alerts.yaml

echo ""
echo "=== DONE ==="
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80"
echo "  http://localhost:3001  (admin / admin)"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward -n monitoring svc/monitoring-kube-prom-prometheus 9090:9090"
echo "  http://localhost:9090"
echo ""
echo "Access Alertmanager:"
echo "  kubectl port-forward -n monitoring svc/monitoring-kube-prom-alertmanager 9093:9093"
echo "  http://localhost:9093"
