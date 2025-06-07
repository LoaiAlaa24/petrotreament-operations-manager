# Petrotreatment Operation Manager

A full-stack web application for managing wastewater vehicle reception operations.

**P.P.E.S. - Petrotreatment for Petroleum and Environmental Services**

## Features

- **Data Entry Form**: Input vehicle reception data with all required fields
- **Dynamic Table Management**: View, edit, and delete records with sorting/filtering
- **PDF Report Generation**: Export daily, weekly, or monthly reports
- **Mobile-First Design**: Responsive interface for desktop and mobile
- **User Authentication**: Role-based access control (optional)

## Tech Stack

- **Frontend**: React.js + TailwindCSS
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: SQLite (development) / PostgreSQL (production)
- **PDF Export**: ReportLab
- **Deployment**: Docker + Docker Compose

## Quick Start

1. Clone the repository
2. Run with Docker Compose:
   ```bash
   docker-compose up
   ```
3. Access the application at `http://localhost:3000`

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
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