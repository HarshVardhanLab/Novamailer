# NovaMailer - Azure Deployment with MySQL

## Quick Start

```bash
./deploy-with-mysql.sh
```

## What This Does

1. **Creates MySQL Flexible Server** - A managed database that persists data
2. **Deploys Backend** - FastAPI app connected to MySQL
3. **Deploys Frontend** - Next.js app pointing to backend

## Why MySQL Instead of SQLite?

Azure App Service has a **read-only file system** for deployed code. SQLite needs to write database files, which fails with:
```
sqlite3.OperationalError: unable to open database file
```

MySQL solves this by using a separate managed database service.

## Cost

- **MySQL Flexible Server (Burstable B1ms)**: ~$12-15/month
- **App Service Plan (F1 Free)**: $0
- **Total**: ~$12-15/month

## After Deployment

### 1. Update Environment Variables

Go to Azure Portal → Your Backend App → Configuration:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SECRET_KEY=generate-a-secure-random-key
```

### 2. Test the Backend

```bash
curl https://novamailer-backend.azurewebsites.net/health
```

### 3. Access Your App

Frontend: https://novamailer-frontend.azurewebsites.net

## Database Connection

The script automatically configures:
```
mysql+aiomysql://novaadmin:PASSWORD@SERVER.mysql.database.azure.com:3306/novamailer
```

## Troubleshooting

### Backend won't start
Check logs:
```bash
az webapp log tail --name novamailer-backend --resource-group novamailer
```

### Can't connect to database
1. Check firewall rules in Azure Portal
2. Verify connection string in app settings
3. Ensure `aiomysql` is in requirements.txt

### Frontend can't reach backend
Update CORS settings in backend or check NEXT_PUBLIC_API_URL

## Manual Steps (if script fails)

1. Create MySQL server in Azure Portal
2. Create database named "novamailer"
3. Get connection string
4. Update backend app settings with DATABASE_URL
5. Deploy backend code
6. Deploy frontend code

## Alternative: Use PostgreSQL

If you prefer PostgreSQL:
```bash
# Change in script:
az postgres flexible-server create ...
# Update DATABASE_URL to:
postgresql+asyncpg://user:pass@server.postgres.database.azure.com/db
# Add to requirements.txt:
asyncpg
```
