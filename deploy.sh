#!/bin/bash

# Production Deployment Script for Petrotreatment Station Operations

set -e

echo "🚀 Starting Production Deployment..."

# Check if environment file exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your production settings."
    exit 1
fi

# Load environment variables
source .env.production

# Validate required environment variables
if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$SECRET_KEY" ] || [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
    echo "❌ Missing required environment variables in .env.production"
    echo "Required: POSTGRES_PASSWORD, SECRET_KEY, FRONTEND_URL, BACKEND_URL"
    exit 1
fi

echo "✅ Environment variables loaded"

# Create backup directory
mkdir -p backups

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start production containers
echo "🔨 Building production containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Create admin users
echo "👤 Creating admin users..."
docker-compose -f docker-compose.prod.yml exec -T backend python create_admin.py

# Show status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "🌐 Your application is now live at:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend API: $BACKEND_URL"
echo "   API Documentation: $BACKEND_URL/docs"
echo ""
echo "🔑 Default login credentials:"
echo "   Super Admin - Username: super_admin, Password: super123"
echo "   Admin - Username: admin, Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change default passwords immediately!"
echo ""
echo "📋 Management commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo "   Backup DB: docker-compose -f docker-compose.prod.yml exec db pg_dump -U station_user station_ops > backups/backup-\$(date +%Y%m%d).sql"