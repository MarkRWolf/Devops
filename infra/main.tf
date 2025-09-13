locals {
  name     = "saas-portfolio"
  location = "northeurope"
  rg_name  = "saas-aks-rg"
  acr_name = "saasportfolioreg"
}

data "azurerm_resource_group" "rg" { name = local.rg_name }

data "azurerm_container_registry" "acr" {
  name                = local.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
}
