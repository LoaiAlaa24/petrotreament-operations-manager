FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Create missing directories
RUN mkdir -p public src

# Expose port
EXPOSE 3000

# Set environment
ENV CHOKIDAR_USEPOLLING=true

# Start the application
CMD ["npm", "start"]