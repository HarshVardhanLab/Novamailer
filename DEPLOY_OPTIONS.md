# NovaMailer - Azure Deployment Options

## Your Subscription Limitations

Azure for Students Starter has **very limited** database options:
- ❌ MySQL (Microsoft.DBforMySQL) - **BLOCKED**
- ❌ PostgreSQL (Microsoft.DBforPostgreSQL) - **BLOCKED**
- ⏳ Azure SQL (Microsoft.Sql) - **Registering** (takes 5-10 minutes)

## Option 1: Azure Storage + SQLite (Works Now!) ⭐

**Use this if you want to deploy immediately**

```bash
./deploy-with-storage.sh
```

### How it works:
1. Creates Azure Storage Account with File Share
2. Mounts file share to `/data` in App Service
3. SQLite database stored at `/data/novamailer.db`
4. Data persists across deployments

### Cost:
- **B1 App Service Plan**: ~$13/month (required for storage mount)
- **Storage Account**: ~$0.50/month (1GB)
- **Total**: ~$13.50/month

### Pros:
- ✅ Works immediately
- ✅ Simple setup
- ✅ SQLite (no driver changes needed)
- ✅ Data persists

### Cons:
- ❌ Requires B1 plan (not free)
- ❌ SQLite not ideal for high concurrency
- ❌ File share has some latency

---

## Option 2: Azure SQL Database (Wait 5-10 min)

**Use this for production-grade database**

```bash
# Check registration status
az provider show --namespace Microsoft.Sql --query "registrationState"

# When it shows "Registered", run:
./deploy-with-azuresql.sh
```

### Cost:
- **F1 App Service Plan**: Free
- **Azure SQL Basic**: ~$5/month
- **Total**: ~$5/month

### Pros:
- ✅ Cheaper overall
- ✅ Production-grade database
- ✅ Better for concurrency
- ✅ Automatic backups

### Cons:
- ⏳ Need to wait for registration
- ❌ Requires connection string changes

---

## Option 3: Wait for Free Tier (Not Recommended)

You could wait and try to get access to free database tiers, but:
- Azure for Students Starter is very limited
- May never get access to MySQL/PostgreSQL
- Better to use one of the above options

---

## Recommendation

### For Development/Testing:
Use **Option 1 (Storage + SQLite)** - Deploy now, works immediately

### For Production:
Wait for **Option 2 (Azure SQL)** to register - Better performance, cheaper

---

## Check SQL Registration Status

```bash
az provider show --namespace Microsoft.Sql --query "registrationState"
```

When it shows `"Registered"`, you can use Azure SQL!

---

## Current Status

Run this to check:
```bash
az provider list --query "[?namespace=='Microsoft.Sql'].{Namespace:namespace, State:registrationState}" -o table
```
