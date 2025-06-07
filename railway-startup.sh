#!/bin/bash

# Railway startup script for combined frontend + backend

set -e

echo "🚀 Starting Railway deployment..."

# Use Railway's PORT or default to 8080
PORT=${PORT:-8080}

# Update nginx to use Railway's PORT
sed -i "s/listen 8080;/listen $PORT;/" /etc/nginx/sites-available/default

# Start nginx in background
echo "📡 Starting Nginx..."
nginx -g 'daemon on; master_process on;'

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

# Start FastAPI backend
echo "🚀 Starting FastAPI backend..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1