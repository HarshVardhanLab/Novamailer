# NovaMailer - Azure SQL Database Deployment

## ✅ Compatible with Azure for Students Starter

Your subscription allows: `Microsoft.Sql` (Azure SQL Database)

## Quick Start

```bash
./deploy-with-azuresql.sh
```

## What This Does

1. **Creates Azure SQL Server** - Managed SQL Server instance
2. **Creates SQL Database** - Basic tier database (5 DTU, 2GB)
3. **Configures Firewall** - Allows Azure services to connect
4. **Deploys Backend** - FastAPI with SQL Server connection
5. **Deploys Frontend** - Next.js app

## Why Azure SQL?

Your Azure for Students Starter subscription **only allows**:
- ✅ Microsoft.Sql (Azure SQL Database)
- ❌ Microsoft.DBforMySQL (blocked)
- ❌ Microsoft.DBforPostgreSQL (blocked)

## Cost

- **Azure SQL Database (Basic tier)**: ~$5/month
- **App Service Plan (F1 Free)**: $0
- **Total**: ~$5/month

## Connection String

The script uses:
```
mssql+aioodbc://user:pass@server.database.windows.net:1433/db?driver=ODBC+Driver+18+for+SQL+Server
```

## After Deployment

### 1. Update SMTP Settings

Azure Portal → Backend App → Configuration → Application settings:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SECRET_KEY=generate-secure-random-key-here
```

### 2. Test Backend

```bash
# Health check
curl https://novamailer-backend.azurewebsites.net/health

# Check logs
az webapp log tail --name novamailer-backend --resource-group novamailer
```

### 3. Access Frontend

https://novamailer-frontend.azurewebsites.net

## Troubleshooting

### ODBC Driver Not Found

Azure App Service includes ODBC Driver 18 by default. If you see driver errors, the connection string will auto-negotiate.

### Can't Connect to Database

1. Check firewall rules in Azure Portal
2. Verify the SQL Server allows Azure services (0.0.0.0 rule)
3. Check connection string in app settings

### Backend Crashes on Startup

Check logs:
```bash
az webapp log tail --name novamailer-backend --resource-group novamailer
```

Common issues:
- Missing `aioodbc` or `pyodbc` in requirements.txt
- Wrong DATABASE_URL format
- Database migrations not run

### Run Migrations Manually

```bash
# SSH into the app
az webapp ssh --name novamailer-backend --resource-group novamailer

# Run migrations
cd /home/site/wwwroot
python -m alembic upgrade head
```

## Database Management

### Connect with Azure Data Studio

1. Download Azure Data Studio
2. Server: `novamailer-sql-XXXXX.database.windows.net`
3. Database: `novamailer`
4. User: `novaadmin`
5. Password: (from script)

### Query Database

```bash
az sql db show-connection-string \
  --server novamailer-sql-XXXXX \
  --name novamailer \
  --client sqlcmd
```

## Alternative: Use SQLite with Azure Files

If you want to avoid database costs, you can mount Azure Files:

1. Create Azure Storage Account
2. Create File Share
3. Mount to `/data` in App Service
4. Use `sqlite:////data/novamailer.db`

But this is more complex and not recommended for production.

## Recommended: Use Azure SQL

Azure SQL is the best option because:
- ✅ Allowed in your subscription
- ✅ Fully managed
- ✅ Automatic backups
- ✅ Good performance
- ✅ Only ~$5/month
