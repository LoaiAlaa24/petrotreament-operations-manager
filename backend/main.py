from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models
from database import engine, get_db
from config import settings
from routers import vehicle_receptions, auth, reports
import os

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

# Mount static files for frontend (Railway deployment)
static_dir = "static"
if os.path.exists(static_dir):
    print(f"📁 Static directory found: {static_dir}")
    
    # Check if React build structure exists
    static_css_dir = os.path.join(static_dir, "static", "css")
    static_js_dir = os.path.join(static_dir, "static", "js")
    
    if os.path.exists(static_css_dir):
        app.mount("/static/css", StaticFiles(directory=static_css_dir), name="static_css")
        print(f"📁 Mounted CSS: /static/css -> {static_css_dir}")
    
    if os.path.exists(static_js_dir):
        app.mount("/static/js", StaticFiles(directory=static_js_dir), name="static_js") 
        print(f"📁 Mounted JS: /static/js -> {static_js_dir}")
    
    # Mount the entire static directory for other assets
    react_static_dir = os.path.join(static_dir, "static")
    if os.path.exists(react_static_dir):
        app.mount("/static", StaticFiles(directory=react_static_dir), name="static_assets")
        print(f"📁 Mounted static assets: /static -> {react_static_dir}")
    
    # Direct CSS and JS mounting (React puts files directly in these folders)
    css_dir = os.path.join(static_dir, "css")
    js_dir = os.path.join(static_dir, "js")
    
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
        print(f"📁 Mounted CSS: /css -> {css_dir}")
        
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
        print(f"📁 Mounted JS: /js -> {js_dir}")
else:
    print(f"❌ Static directory not found: {static_dir}")

# Include routers first, then catch-all for SPA
@app.get("/api")
async def api_root():
    """API root endpoint"""
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

@app.get("/debug/static")
async def debug_static():
    """Debug endpoint to check static files"""
    import glob
    
    static_info = {
        "static_dir_exists": os.path.exists(static_dir),
        "static_contents": [],
        "css_files": [],
        "js_files": []
    }
    
    if os.path.exists(static_dir):
        # List all files in static directory
        for root, dirs, files in os.walk(static_dir):
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), static_dir)
                static_info["static_contents"].append(rel_path)
                
                if file.endswith('.css'):
                    static_info["css_files"].append(rel_path)
                elif file.endswith('.js'):
                    static_info["js_files"].append(rel_path)
    
    return static_info

# Serve React App (catch-all route for SPA)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """Serve React app for all non-API routes"""
    # Don't serve static files through this route
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "health")):
        raise HTTPException(status_code=404, detail="Not found")
    
    static_file_path = os.path.join(static_dir, full_path)
    
    # If it's a file that exists, serve it
    if os.path.isfile(static_file_path):
        return FileResponse(static_file_path)
    
    # Otherwise serve index.html (for React Router)
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    # Fallback if no static files
    return {"message": "Frontend not built yet"}