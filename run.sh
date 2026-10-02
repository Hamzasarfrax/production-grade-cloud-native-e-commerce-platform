
echo "run ingress on port 80 for domain.local "
# port forword 
sudo kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 80:80 &

echo "run argo cd on port 8080"

kubectl port-forward -n argocd svc/argocd-server 8080:443 &

echo "Open https://localhost:8080"

echo "Access Grafana Port forward on 3001"

kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80 &

echo "Open  https://localhost:3001"

echo "Check: kubectl get imageupdaters -n argocd"
