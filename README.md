# NovaMailer - Email Campaign Manager

A full-stack email campaign management system built with FastAPI and Next.js.

## Features

- 📧 Email campaign management
- � Campaign analytics and tracking
- 📝 Template management with variables
- � File attachments support
- 🔐 User authentication with JWT
- �  SMTP configuration
- 📤 CSV recipient upload
- 🎨 Modern UI with Next.js and Tailwind CSS

## Tech Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- Supabase (PostgreSQL)
- JWT Authentication
- Async SMTP

**Frontend:**
- Next.js 15
- React 19
- Tailwind CSS
- Axios
- Shadcn UI

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- Supabase account (free tier)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Update `.env` with your Supabase credentials

5. Run the backend:
```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the frontend:
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## Quick Start Script

Run both backend and frontend together:

```bash
./run-local.sh
```

## SMTP Configuration

For local development, configure SMTP in the app:

**Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: App Password (generate at https://myaccount.google.com/apppasswords)

**Note:** Gmail SMTP works locally but may be blocked on some cloud platforms.

## Database

The app uses Supabase (PostgreSQL). Tables are created automatically on first run.

To manually create tables:
```bash
cd backend
python create_tables.py
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SECRET_KEY=your-secret-key-min-32-characters
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
novamailer/
├── backend/
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── core/         # Config & database
│   ├── main.py           # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
│   └── package.json
└── README.md
```

## Deployment

See `DEPLOY_VERCEL_SUPABASE.md` for deployment instructions.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
