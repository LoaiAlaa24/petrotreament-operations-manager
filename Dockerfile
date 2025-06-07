# Multi-stage build for Railway deployment
# This combines frontend and backend into a single container

# Stage 1: Build React Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend with Frontend
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build /var/www/html

# Copy nginx configuration for serving frontend
COPY railway-nginx.conf /etc/nginx/sites-available/default

# Create directories
RUN mkdir -p data logs

# Copy startup script
COPY railway-startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Expose port (Railway uses PORT environment variable)
EXPOSE $PORT

# Start both nginx and backend
CMD ["./startup.sh"]