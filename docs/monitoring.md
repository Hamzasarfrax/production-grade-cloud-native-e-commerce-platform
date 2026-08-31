

helm install monitoring \
  prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace


  kubectl get pods -n monitoring


  STEP 3 — Grafana access

KIND mein temporarily:

kubectl port-forward \
  svc/monitoring-grafana \
  3002:80 \
  -n monitoring

Then ":
  

http://localhost:3002 

Grafana ke andar Prometheus datasource usually Helm stack ke through configure ho jata hai.


kubectl get secret monitoring-grafana \
  -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 -d && echo