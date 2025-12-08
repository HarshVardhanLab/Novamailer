#!/bin/bash

echo "🔍 Checking Azure Resources..."
echo ""

RESOURCE_GROUP="novamailer-rg"

echo "📦 Resource Group: $RESOURCE_GROUP"
az group show --name $RESOURCE_GROUP --query "{Name:name, Location:location}" --output table 2>/dev/null || echo "Not found"
echo ""

echo "📋 App Service Plans:"
az appservice plan list --resource-group $RESOURCE_GROUP --output table 2>/dev/null || echo "None found"
echo ""

echo "🌐 Web Apps:"
az webapp list --resource-group $RESOURCE_GROUP --output table 2>/dev/null || echo "None found"
echo ""

echo "💡 To delete all resources and start fresh:"
echo "   az group delete --name $RESOURCE_GROUP --yes"
