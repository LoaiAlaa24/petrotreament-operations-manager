# Alternative Railway Deployment (Backend Only)

If the full build keeps failing due to memory limits, here's a backend-only approach:

## Option 1: Deploy Backend Only to Railway

1. Create a new folder `railway-backend`:
```bash
mkdir railway-backend
cp -r backend/* railway-backend/
```

2. Create `railway-backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p data

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3. Deploy this to Railway (backend only)

4. Deploy frontend separately to:
   - Vercel (free)
   - Netlify (free) 
   - Surge.sh (free)

## Option 2: Use Render.com Instead

Render has higher memory limits:

1. Push to GitHub
2. Go to Render.com
3. Connect GitHub repo
4. Create "Web Service"
5. Build command: `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
6. Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

## Option 3: DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Connect GitHub
3. Configure as multi-component app:
   - Frontend: Node.js static site
   - Backend: Python app
   - Database: PostgreSQL

Would you like me to set up any of these alternatives?