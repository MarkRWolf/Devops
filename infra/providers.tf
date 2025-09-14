terraform {
  required_version = ">= 1.7.0"
  required_providers {
    azurerm    = { source = "hashicorp/azurerm", version = "~> 4.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.32" }
    helm       = { source = "hashicorp/helm", version = "~> 2.12" }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
