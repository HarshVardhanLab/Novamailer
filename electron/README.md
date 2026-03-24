# NovaMailer Desktop App

Desktop application built with Electron that bundles the NovaMailer frontend and backend.

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+ with venv
- All dependencies installed for both frontend and backend

## Development

1. **Install Electron dependencies:**
   ```bash
   cd electron
   npm install
   ```

2. **Make sure backend and frontend are set up:**
   ```bash
   # Backend setup (from project root)
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..

   # Frontend setup
   cd frontend
   npm install
   cd ..
   ```

3. **Run in development mode:**
   ```bash
   cd electron
   npm run dev
   ```

   This will:
   - Start the Python backend on port 8000
   - Start the Next.js frontend on port 3000
   - Open the Electron window

## Building for Production

### Build the frontend first:
```bash
cd frontend
npm run build
cd ..
```

### Build the desktop app:

**For macOS:**
```bash
cd electron
npm run build:mac
```

**For Windows:**
```bash
cd electron
npm run build:win
```

**For Linux:**
```bash
cd electron
npm run build:linux
```

**For all platforms:**
```bash
cd electron
npm run build
```

The built applications will be in `electron/dist/`

## Distribution

The packaged app includes:
- Electron wrapper
- Next.js frontend (standalone build)
- Python backend with all dependencies
- SQLite database (created on first run)

Users can run the app without installing Node.js or Python separately.

## Configuration

The app uses a local SQLite database by default. To use PostgreSQL/Supabase:

1. Create a `.env` file in the backend folder inside the app
2. Set `DATABASE_URL` to your PostgreSQL connection string

## Troubleshooting

**Backend won't start:**
- Check that Python venv is properly set up in `backend/venv`
- Verify all Python dependencies are installed

**Frontend won't load:**
- Ensure Next.js build completed successfully
- Check that port 3000 is not already in use

**App won't build:**
- Make sure you've run `npm run build` in the frontend folder first
- Verify electron-builder is installed correctly
