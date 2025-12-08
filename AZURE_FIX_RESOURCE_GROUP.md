# 🔧 Fix: Resource Group Already Exists

Your resource group `novamailer-rg` already exists in `eastus` region, but your subscription only allows certain regions.

---

## ⚡ Quick Fix (Choose One)

### Option 1: Delete Existing Resource Group (Recommended)

This will delete everything in the old resource group and start fresh:

```bash
# Delete existing resource group
az group delete --name novamailer-rg --yes --no-wait

# Wait a moment for deletion to start
sleep 10

# Deploy with new region
./deploy-azure.sh
```

---

### Option 2: Use Different Resource Group Name

Keep the old one and create a new deployment:

```bash
# Use a new resource group name
export RESOURCE_GROUP=novamailer-sea-rg

# Deploy
./deploy-azure.sh
```

---

### Option 3: Check What's in Existing Resource Group

See what resources exist before deciding:

```bash
# List resources in the group
az resource list --resource-group novamailer-rg --output table

# If nothing important, delete it (Option 1)
# If you want to keep it, use Option 2
```

---

## 🎯 Recommended: Clean Start

For a fresh deployment, delete the old resource group:

```bash
#!/bin/bash

echo "🗑️  Deleting old resource group..."
az group delete --name novamailer-rg --yes --no-wait

echo "⏳ Waiting for deletion to start..."
sleep 15

echo "🚀 Starting new deployment..."
./deploy-azure.sh
```

---

## 📋 Complete Deployment Commands

Copy and paste this entire block:

```bash
#!/bin/bash

# Delete old resource group
az group delete --name novamailer-rg --yes --no-wait

# Wait for deletion
echo "Waiting 15 seconds for deletion to start..."
sleep 15

# Deploy to Southeast Asia
export LOCATION=southeastasia
./deploy-azure.sh
```

---

## 🌍 Alternative: Use Different Region

If you want to use the existing `eastus` resource group, you need to check if `eastus` is allowed:

```bash
# Check your allowed regions
az account list-locations --query "[].name" --output table

# If eastus is NOT in your allowed list, you must delete the resource group
# If eastus IS in your allowed list, you can use it:
export LOCATION=eastus
./deploy-azure.sh
```

**Note**: Based on the error, `eastus` is NOT in your allowed regions, so you should delete the resource group.

---

## 🐛 Troubleshooting

### Issue: "Deletion is taking too long"

```bash
# Check deletion status
az group show --name novamailer-rg

# If it says "NotFound", it's deleted and you can proceed
# If it still exists, wait a bit more
```

### Issue: "Cannot delete resource group"

```bash
# Force delete with no-wait
az group delete --name novamailer-rg --yes --no-wait --force-deletion-types Microsoft.Compute/virtualMachines

# Or delete resources individually first
az resource list --resource-group novamailer-rg --query "[].id" --output tsv | xargs -I {} az resource delete --ids {}
```

---

## ✅ After Fixing

Once you've chosen an option and the deployment succeeds, you'll see:

```
🎉 Deployment Complete!
=======================

📱 Frontend: https://novamailer-frontend.xxx.southeastasia.azurecontainerapps.io
🔧 Backend:  https://novamailer-backend.xxx.southeastasia.azurecontainerapps.io
```

---

## 💡 Prevention

To avoid this in the future:
- Always use allowed regions from the start
- Delete old resource groups when changing regions
- Use descriptive resource group names (e.g., `novamailer-sea-rg` for Southeast Asia)

---

**Recommended Action**: Delete the old resource group and deploy fresh! 🚀
