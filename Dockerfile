# Simplified Railway deployment - Backend only with static frontend serving
FROM python:3.11-slim

# Install system dependencies (minimal set)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for building frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Build frontend first
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Switch back to app directory for backend
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Create directories
RUN mkdir -p data static

# Copy built frontend to static directory
RUN if [ -d "frontend/build" ]; then \
        cp -r frontend/build/* static/ && \
        echo "✅ Frontend build copied to static/"; \
        ls -la static/; \
        ls -la static/static/ || echo "No static subdirectory"; \
    else \
        echo "❌ Frontend build not found"; \
    fi

# Copy startup script
COPY railway-startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Expose port
EXPOSE 8000

# Start application
CMD ["./startup.sh"]