#!/bin/bash

# Docker Helper Script for Station Operations Management System

function show_help() {
    echo "Petrotreatment Operation Manager - Docker Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the application (build and run)"
    echo "  stop      - Stop the application"
    echo "  restart   - Restart the application"
    echo "  logs      - Show application logs"
    echo "  clean     - Clean up containers and volumes"
    echo "  status    - Show container status"
    echo "  shell     - Open shell in backend container"
    echo "  help      - Show this help message"
    echo ""
}

case "$1" in
    start)
        echo "🚀 Starting Petrotreatment Operation Manager..."
        
        # Create .env file if it doesn't exist
        if [ ! -f .env ]; then
            echo "📝 Creating .env file from template..."
            cp .env.example .env
        fi
        
        # Build and start containers
        docker-compose up --build -d
        
        echo "⏳ Waiting for services to be ready..."
        sleep 15
        
        echo "✅ System started!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend API: http://localhost:8000"
        echo "📚 API Docs: http://localhost:8000/docs"
        echo "🔑 Default login: admin / admin123"
        ;;
        
    stop)
        echo "🛑 Stopping Petrotreatment Operation Manager..."
        docker-compose down
        echo "✅ System stopped!"
        ;;
        
    restart)
        echo "🔄 Restarting Petrotreatment Operation Manager..."
        docker-compose down
        docker-compose up --build -d
        echo "✅ System restarted!"
        ;;
        
    logs)
        echo "📋 Showing application logs..."
        docker-compose logs -f
        ;;
        
    clean)
        echo "🧹 Cleaning up containers and volumes..."
        docker-compose down -v
        docker system prune -f
        echo "✅ Cleanup complete!"
        ;;
        
    status)
        echo "📊 Container status:"
        docker-compose ps
        ;;
        
    shell)
        echo "🐚 Opening shell in backend container..."
        docker-compose exec backend bash
        ;;
        
    help|*)
        show_help
        ;;
esac