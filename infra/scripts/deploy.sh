#!/usr/bin/env bash
# deploy.sh — Terraform wrapper per environment.
#   ./scripts/deploy.sh -e dev -a plan
#   ./scripts/deploy.sh -e stag -a apply
#   ./scripts/deploy.sh -e prod -a destroy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT=""
ACTION="plan"

usage() {
  echo "Usage: $0 -e <dev|stag|prod> [-a <init|plan|apply|destroy|output|validate>]"
  exit 1
}

while getopts "e:a:h" opt; do
  case "$opt" in
    e) ENVIRONMENT="$OPTARG" ;;
    a) ACTION="$OPTARG" ;;
    h|*) usage ;;
  esac
done

case "$ENVIRONMENT" in
  dev | stag | prod) ;;
  *) echo "ERROR: -e must be one of dev|stag|prod"; usage ;;
esac

ENV_DIR="$ROOT_DIR/env/$ENVIRONMENT"
echo "==> env: $ENV_DIR  action: $ACTION"

cd "$ENV_DIR"

case "$ACTION" in
  init)
    terraform init -upgrade
    ;;
  plan)
    terraform init
    terraform plan -out="tfplan-$ENVIRONMENT"
    echo "Plan saved as tfplan-$ENVIRONMENT — review karo, phir: $0 -e $ENVIRONMENT -a apply"
    ;;
  apply)
    if [[ -f "tfplan-$ENVIRONMENT" ]]; then
      terraform apply "tfplan-$ENVIRONMENT"
    else
      terraform init
      terraform apply
    fi
    ;;
  destroy)
    terraform init
    terraform destroy
    ;;
  output)
    terraform output
    ;;
  validate)
    terraform init -backend=false
    terraform validate
    ;;
  *)
    usage
    ;;
esac
