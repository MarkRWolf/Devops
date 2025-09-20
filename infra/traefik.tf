resource "helm_release" "traefik" {
  name             = "traefik"
  namespace        = "traefik"
  create_namespace = true
  repository       = "https://traefik.github.io/charts"
  chart            = "traefik"
  version          = "37.1.1"

  set {
    name  = "service.type"
    value = "LoadBalancer"
  }
  set {
    name  = "resources.requests.cpu"
    value = "50m"
  }
  set {
    name  = "resources.requests.memory"
    value = "64Mi"
  }
  set {
    name  = "resources.limits.cpu"
    value = "250m"
  }
  set {
    name  = "resources.limits.memory"
    value = "256Mi"
  }

  depends_on = [azurerm_kubernetes_cluster.aks]
}
