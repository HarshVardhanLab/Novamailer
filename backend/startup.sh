#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Run migrations if needed
python migrate_otp.py || true

# Start the application
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
