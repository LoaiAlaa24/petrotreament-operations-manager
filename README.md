# Petrotreatment Operation Manager

[![CI/CD Pipeline](https://github.com/LoaiAlaa24/petrotreament-operations-manager/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/LoaiAlaa24/petrotreament-operations-manager/actions/workflows/ci-cd.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18.2-blue.svg)](https://reactjs.org)

A full-stack web application for managing wastewater vehicle reception operations with role-based access control and automated deployment.

**P.P.E.S. - Petrotreatment for Petroleum and Environmental Services**

## Features

- **Data Entry Form**: Input vehicle reception data with all required fields
- **Dynamic Table Management**: View, edit, and delete records with sorting/filtering
- **PDF Report Generation**: Export daily, weekly, or monthly reports
- **Role-Based Access Control**: Super admin and admin user roles with different permissions
- **Multi-Language Support**: Arabic and English with RTL layout support
- **Financial Reporting**: Cost calculations per company with configurable rates
- **Mobile-First Design**: Responsive interface for desktop and mobile
- **Automated CI/CD**: GitHub Actions pipeline with automated testing and deployment

## Tech Stack

- **Frontend**: React.js + TypeScript + TailwindCSS + React Query
- **Backend**: Python FastAPI + SQLAlchemy + JWT Authentication
- **Database**: SQLite (development) / PostgreSQL (production)
- **PDF Export**: ReportLab with multi-language support
- **Deployment**: Docker + Railway.app with automated CI/CD
- **Testing**: GitHub Actions + Jest + Pytest

## Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/LoaiAlaa24/petrotreament-operations-manager.git
   cd petrotreament-operations-manager
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up
   ```

3. Access the application at `http://localhost:3000`

4. Default login credentials:
   - **Super Admin**: `superadmin` / `superadmin123`
   - **Admin**: `admin` / `admin123`

## Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

### Testing
```bash
# Frontend tests
cd frontend && npm run lint && npm run build && npm test

# Backend tests
cd backend && python -m pytest

# Docker build test
docker build -t petrotreatment-app .
```

## Data Fields

- Date
- Day of the week
- Company name (Petronifertiti, Unico, Nesbco North Sinai)
- Number of vehicles received
- Type of water (contaminated water, sludge)
- Total quantity (cubic meters)
- Arrival time
- Departure time
- Exit time from drilling site (optional)

## CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline using GitHub Actions:

### Automated Testing
- **Frontend**: ESLint, TypeScript compilation, and build tests
- **Backend**: Python testing with PostgreSQL integration
- **Security**: Trivy vulnerability scanning
- **Docker**: Container build verification

### Automated Deployment
- **Production**: Deploys to Railway on `main` branch pushes
- **Staging**: Deploys to staging on `develop` branch pushes
- **Health Checks**: Automatic application health verification

### Pipeline Triggers
- Push to `main` → Full CI/CD with production deployment
- Push to `develop` → CI/CD with staging deployment  
- Pull Requests → Testing and building only

### Setup Instructions
1. Set up GitHub repository secrets (see [CI/CD Setup Guide](CI_CD_SETUP.md))
2. Configure Railway projects for production and staging
3. Push to `main` or `develop` to trigger deployments

For detailed setup instructions, see [CI_CD_SETUP.md](CI_CD_SETUP.md)

## Deployment

### Automatic Deployment
Deployments are handled automatically by the CI/CD pipeline when pushing to:
- `main` branch → Production
- `develop` branch → Staging

### Manual Deployment
For manual deployments, use the provided script:
```bash
./deploy-manual.sh
```

### Railway Setup
1. Install Railway CLI: `curl -fsSL https://railway.app/install.sh | sh`
2. Login: `railway login`
3. Deploy: `railway up`

## User Roles

### Super Admin
- Full access to all features
- Can create, edit, and delete any records
- Access to financial reports and cost calculations
- User management capabilities

### Admin
- Can view all records
- Can only edit/delete records they created
- Access to standard reports (no financial data)
- Limited to operational data