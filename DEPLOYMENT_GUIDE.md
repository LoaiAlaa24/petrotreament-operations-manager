# Production Deployment Guide

## Quick Deployment Options

### Option 1: Cloud Platforms (Recommended)

#### A. Railway.app (Easiest)
1. Push your code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Connect your GitHub repo
4. Railway will auto-detect and deploy your Docker setup
5. Add environment variables in Railway dashboard

#### B. DigitalOcean App Platform
1. Create account at [DigitalOcean](https://digitalocean.com)
2. Go to App Platform
3. Connect GitHub repo
4. Configure:
   - Frontend: Node.js, build command: `npm run build`
   - Backend: Python, Dockerfile
   - Database: PostgreSQL managed database

#### C. Heroku
1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
4. Deploy: `git push heroku main`

### Option 2: VPS/Server Deployment

#### Requirements
- Ubuntu 20.04+ server
- 2GB+ RAM
- Docker & Docker Compose installed
- Domain name (optional but recommended)

#### Step-by-Step Deployment

1. **Setup Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clone and Configure**
```bash
# Clone your repository
git clone <your-repo-url>
cd station-ops

# Copy and edit environment file
cp .env.production .env.prod
nano .env.prod
```

3. **Configure Environment**
Edit `.env.prod` with your settings:
```bash
POSTGRES_PASSWORD=your-super-secure-password
SECRET_KEY=your-32-character-secret-key
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
```

4. **Deploy**
```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy
./deploy.sh
```

### Option 3: AWS/Google Cloud

#### AWS ECS
1. Push images to ECR
2. Create ECS cluster
3. Define task definitions
4. Create services

#### Google Cloud Run
1. Enable Cloud Run API
2. Build and push to GCR
3. Deploy containers

## DNS Configuration

If using a custom domain:

1. **Add DNS Records:**
   - A record: `@` → Your server IP
   - A record: `api` → Your server IP

2. **SSL Certificate (Free with Let's Encrypt):**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

## Environment Variables Reference

### Required Variables
- `POSTGRES_PASSWORD`: Database password (min 12 characters)
- `SECRET_KEY`: JWT secret key (min 32 characters)
- `FRONTEND_URL`: Your frontend URL (https://your-domain.com)
- `BACKEND_URL`: Your backend URL (https://api.your-domain.com)

### Optional Variables
- `SSL_CERT_PATH`: Path to SSL certificate
- `SSL_KEY_PATH`: Path to SSL private key

## Security Checklist

- [ ] Change default admin passwords
- [ ] Use strong database password
- [ ] Use secure SECRET_KEY (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (only ports 80, 443, 22)
- [ ] Regular database backups
- [ ] Monitor logs

## Monitoring & Maintenance

### Database Backup
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U station_user station_ops > backup.sql

# Automated daily backup (add to crontab)
0 2 * * * cd /path/to/station-ops && docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U station_user station_ops > backups/backup-$(date +\%Y\%m\%d).sql
```

### Log Monitoring
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in docker-compose.prod.yml
2. **Database connection**: Check POSTGRES_PASSWORD
3. **CORS errors**: Verify FRONTEND_URL in backend environment
4. **SSL issues**: Check certificate paths and permissions

### Support
For deployment issues, check:
1. Container logs: `docker-compose logs`
2. Service status: `docker-compose ps`
3. Network connectivity: `curl http://localhost:8000`