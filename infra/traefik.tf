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

  depends_on = [azurerm_kubernetes_cluster.aks]
}
