#!/bin/bash

# Petrotreatment Operation Manager Startup Script

echo "🚀 Starting Petrotreatment Operation Manager..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. You may want to update the configuration."
fi

echo "🐳 Building and starting containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "👤 Creating default admin user..."
docker-compose exec backend python create_admin.py

echo "✅ System is ready!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "🔑 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  Please change the default password after first login!"
echo ""
echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"