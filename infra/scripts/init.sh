#!/usr/bin/env bash
# init.sh — Terraform remote state bootstrap (S3 bucket + DynamoDB lock table).
#
# Ye script infra/remote-backend/ ko apply karti hai taake baaki environments
# (env/dev, env/stag, env/prod) S3 backend use kar sakein.
# Docs me jin files ka reference tha lekin wo missing thi — 2026-09-01 add hui.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/remote-backend"

echo "==> Terraform remote-state bootstrap"
echo "    dir: $BACKEND_DIR"
echo "    ye S3 bucket + DynamoDB lock table create karega (billable resources)."
read -r -p "Continue? [y/N] " answer
if [[ ! "$answer" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

cd "$BACKEND_DIR"
terraform init -upgrade
terraform plan  # manually approve — bucket name globally unique hai, pehle check karo
