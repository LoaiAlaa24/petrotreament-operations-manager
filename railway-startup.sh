#!/bin/bash

# Railway startup script for FastAPI with static frontend serving

set -e

echo "🚀 Starting Railway deployment..."

# Use Railway's PORT or default to 8000
export PORT=${PORT:-8000}

# Wait for database to be ready (Railway PostgreSQL)
if [ ! -z "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database..."
    python -c "
import time
import psycopg2
import os
from urllib.parse import urlparse

url = urlparse(os.environ['DATABASE_URL'])
for i in range(30):
    try:
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            database=url.path[1:],
            user=url.username,
            password=url.password
        )
        conn.close()
        print('✅ Database connected!')
        break
    except:
        if i == 29:
            raise Exception('❌ Database connection failed')
        time.sleep(2)
"
fi

# Run database migrations/setup
echo "🗄️ Setting up database..."
python -c "
from database import engine, Base
Base.metadata.create_all(bind=engine)
print('✅ Database tables created')
"

# Create admin users
echo "👤 Creating admin users..."
python create_admin.py || echo "⚠️ Admin users might already exist"

# Start FastAPI backend with static file serving
echo "🚀 Starting FastAPI backend..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1