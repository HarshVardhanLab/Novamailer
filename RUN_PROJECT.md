# How to Run NovaMailer

> **Note**: Docker is not currently installed on this system. Follow the Manual Setup instructions below.

## Manual Setup (Recommended for this system)

### Prerequisites
- Node.js 18+ and npm ✅ (Installed)
- Python 3.11+ ✅ (Installed)
- PostgreSQL 15+ ⚠️ (Required - see setup below)

### PostgreSQL Setup (Required)

If PostgreSQL is not installed:
```bash
# Install PostgreSQL using Homebrew
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb novamailer
```

### Backend Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Mac/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**
   ```bash
   export DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/novamailer"
   export SECRET_KEY="ussjnYNuQZNDF_qxywuu46Z1XwgCd19ebq40f8M_TP4"
   ```

5. **Run the backend**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory** (in a new terminal)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   ```bash
   export NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

---

## First Time Setup

1. **Register a new account**
   - Go to http://localhost:3000/register
   - Create your account

2. **Configure SMTP Settings**
   - Login and go to Settings
   - Add your SMTP credentials (e.g., Gmail App Password)

3. **Create a Template**
   - Go to Templates → New Template
   - Create an HTML email template with variables like `{{name}}`

4. **Create a Campaign**
   - Go to Campaigns → New Campaign
   - Fill in campaign details
   - Upload a CSV file with recipient data (must have `email` column)
   - Send the campaign

---

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Docker Issues
```bash
# Clean up Docker
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose up --build --force-recreate
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database exists: `createdb novamailer`

---

## Development Commands

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run linter
```

### Backend
```bash
uvicorn main:app --reload           # Development server
uvicorn main:app --host 0.0.0.0     # Production server
```
