#!/bin/bash

# Railway startup script for FastAPI with static frontend serving

set -e

echo "🚀 Starting Railway deployment..."

# Use Railway's PORT or default to 8000
export PORT=${PORT:-8000}

# Database connection will be handled by FastAPI/SQLAlchemy
echo "📊 Database URL configured: ${DATABASE_URL:0:20}..."

# Run database migrations/setup
echo "🗄️ Setting up database..."
python -c "
try:
    from database import engine, Base
    Base.metadata.create_all(bind=engine)
    print('✅ Database tables created')
except Exception as e:
    print(f'⚠️ Database setup warning: {e}')
    print('Will retry on first API call...')
"

# Create admin users
echo "👤 Creating admin users..."
python -c "
try:
    exec(open('create_admin.py').read())
    print('✅ Admin users created/verified')
except Exception as e:
    print(f'⚠️ Admin user creation warning: {e}')
    print('Will create on first API call...')
" || echo "⚠️ Will retry admin user creation later..."

# Start FastAPI backend with static file serving
echo "🚀 Starting FastAPI backend..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1