from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean
from sqlalchemy.sql import func
from database import Base


class VehicleReception(Base):
    """Model for vehicle reception records"""
    __tablename__ = "vehicle_receptions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Date and time fields
    date = Column(DateTime, nullable=False)
    day_of_week = Column(String(20), nullable=False)
    arrival_time = Column(DateTime, nullable=True)
    departure_time = Column(DateTime, nullable=True)
    exit_time_drilling = Column(DateTime, nullable=True)
    
    # Company and vehicle details
    company_name = Column(String(100), nullable=False)
    number_of_vehicles = Column(Integer, nullable=False)
    water_type = Column(String(50), nullable=False)  # contaminated water, sludge, etc.
    total_quantity = Column(Float, nullable=False)  # in cubic meters
    
    # Optional fields
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=True)  # Foreign key to user who created this record


class User(Base):
    """Model for user authentication (optional)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="admin")  # super_admin, admin
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())