#!/bin/bash
# Clean up all Azure resources to start fresh

set -e

echo "🧹 Cleaning up Azure Resources"
echo "==============================="
echo ""

RESOURCE_GROUP="novamailer"

echo "⚠️  This will delete ALL resources in the '$RESOURCE_GROUP' resource group:"
echo "  - Web Apps"
echo "  - App Service Plans"
echo "  - SQL Servers and Databases"
echo "  - Everything else"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Deleting resource group..."
az group delete --name $RESOURCE_GROUP --yes --no-wait

echo ""
echo "✅ Deletion initiated (running in background)"
echo ""
echo "This will take 2-5 minutes to complete."
echo "You can check status with:"
echo "  az group show --name $RESOURCE_GROUP"
echo ""
echo "Once deleted, run: ./deploy-fresh-complete.sh"
echo ""
