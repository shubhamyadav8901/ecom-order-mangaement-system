# Kubernetes Deployment Manifests

This folder contains baseline manifests for deploying backend microservices to Kubernetes.

## Included
- Namespace: `ecom`
- ConfigMap: shared runtime config (`ecom-config`)
- Secret template: `ecom-secrets`
- Deployments + Services + HPAs for:
  - user-service
  - product-service
  - inventory-service
  - order-service
  - payment-service

## Health and scaling
Each deployment includes:
- `readinessProbe` and `livenessProbe` on `/actuator/health`
- resource requests/limits
- HPA (CPU target 70%, min 2, max 6)

## Apply
```bash
kubectl apply -k infra/k8s/base
```

## Before apply
1. Update image names/tags in deployment manifests.
2. Replace values in `secret.template.yaml`.
3. Ensure dependent services (Kafka/Postgres) are reachable from cluster.

## Notes
- These manifests are a baseline for interview/demo environments.
- For production, add NetworkPolicies, PodDisruptionBudgets, external secret manager integration, and separate environment overlays.
