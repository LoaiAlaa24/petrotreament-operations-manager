#!/bin/bash
set -e

echo "🚀 Starting Petrotreatment Operation Manager Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0

while ! pg_isready -h db -p 5432 -U station_user -d station_ops; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database connection failed after $max_attempts attempts"
    exit 1
  fi
  echo "Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ Database is ready!"

# Create admin user if it doesn't exist
echo "👤 Creating admin user..."
python create_admin.py

# Start the application
echo "🌐 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000