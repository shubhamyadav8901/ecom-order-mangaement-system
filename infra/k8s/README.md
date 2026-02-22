# Kubernetes Deployment Manifests

This folder contains deployable Kubernetes resources for the full microservices platform:

- 5 backend services (`user`, `product`, `inventory`, `order`, `payment`)
- 2 frontend apps (`customer-web`, `admin-panel`)
- an in-cluster `nginx-gateway` that handles `/api/*` path rewrites and routes UI traffic
- an Ingress entrypoint for external access

## Structure

- `base/`: common resources shared by all environments
- `overlays/dev`: local/dev overlay
- `overlays/prod`: production overlay (host + TLS patch)

## Base Includes

- Namespace: `ecom`
- ConfigMap: `ecom-config`
- Deployments + Services + HPAs:
  - `user-service`
  - `product-service`
  - `inventory-service`
  - `order-service`
  - `payment-service`
  - `customer-web`
  - `admin-panel`
  - `nginx-gateway`
- Ingress: `ecom-ingress`

`secret.template.yaml` is kept as a reference file only and is intentionally not auto-applied by Kustomize.

## Prerequisites

1. A running Kubernetes cluster.
2. Ingress controller installed (for `ingressClassName: nginx`), e.g. NGINX Ingress.
3. Postgres, Kafka, and Redis reachable from the cluster.
4. Container images available in GHCR (or your own registry).

## Secrets

Create secret values before deployment:

```bash
kubectl create namespace ecom
kubectl create secret generic ecom-secrets -n ecom \
  --from-literal=DB_USERNAME='<db-user>' \
  --from-literal=DB_PASSWORD='<db-password>' \
  --from-literal=JWT_SECRET='<jwt-secret>'
```

## Deploy (Dev Overlay)

```bash
kubectl apply -k infra/k8s/overlays/dev
kubectl get pods -n ecom
```

## Deploy (Prod Overlay)

1. Edit `/infra/k8s/overlays/prod/ingress-host-tls-patch.yaml`:
   - replace `ecom.example.com` with your domain
   - set `secretName` to your TLS secret

2. Apply:

```bash
kubectl apply -k infra/k8s/overlays/prod
kubectl get ingress -n ecom
```

## Image Tag Management

The CI pipeline publishes images to GHCR and, on `main`, can deploy with commit SHA tags.

If deploying manually, set tags in an overlay:

```bash
cd infra/k8s/overlays/prod
kustomize edit set image ghcr.io/babe8901/user-service=ghcr.io/<owner>/user-service:<tag>
kustomize edit set image ghcr.io/babe8901/product-service=ghcr.io/<owner>/product-service:<tag>
kustomize edit set image ghcr.io/babe8901/inventory-service=ghcr.io/<owner>/inventory-service:<tag>
kustomize edit set image ghcr.io/babe8901/order-service=ghcr.io/<owner>/order-service:<tag>
kustomize edit set image ghcr.io/babe8901/payment-service=ghcr.io/<owner>/payment-service:<tag>
kustomize edit set image ghcr.io/babe8901/customer-web=ghcr.io/<owner>/customer-web:<tag>
kustomize edit set image ghcr.io/babe8901/admin-panel=ghcr.io/<owner>/admin-panel:<tag>
cd -
kubectl apply -k infra/k8s/overlays/prod
```

## Health and Scaling

- Backend readiness/liveness probes use `/actuator/health`.
- Frontend and gateway probes use `/`.
- Gateway probe uses `/healthz`.
- HPAs target average CPU utilization of `70%`.

## CI/CD Integration

`.github/workflows/ci.yml` now supports:

- backend verify + frontend lint/build
- image build for all 7 deployable workloads
- GHCR publish on push to `main`
- optional prod deployment when `KUBE_CONFIG_DATA` secret is set

## Recommended Next Production Hardening

- Add NetworkPolicies and PodDisruptionBudgets.
- Use external secret manager (Vault/External Secrets/Cloud Secret Manager).
- Add dedicated observability stack deployment (Prometheus/Grafana/Tempo/Jaeger operators).
- Add canary or blue/green rollout strategy.
