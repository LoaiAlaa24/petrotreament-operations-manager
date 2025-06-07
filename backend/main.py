from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
import models
from database import engine, get_db
from config import settings
from routers import vehicle_receptions, auth, reports

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Petrotreatment Operation Manager API",
    description="API for managing wastewater vehicle reception operations - P.P.E.S. Petrotreatment for Petroleum and Environmental Services",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(
    vehicle_receptions.router,
    prefix=f"{settings.api_v1_str}/vehicle-receptions",
    tags=["Vehicle Receptions"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.api_v1_str}/auth",
    tags=["Authentication"]
)

app.include_router(
    reports.router,
    prefix=f"{settings.api_v1_str}/reports",
    tags=["Reports"]
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Petrotreatment Operation Manager API",
        "company": "P.P.E.S. - Petrotreatment for Petroleum and Environmental Services",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )