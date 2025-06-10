from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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
    
    # Company and waste details
    company_name = Column(String(100), nullable=False)
    water_type = Column(String(50), nullable=False)  # waste type
    total_quantity = Column(Float, nullable=False)  # in cubic meters
    
    # Reception summary - calculated from vehicles
    number_of_vehicles = Column(Integer, nullable=False)  # Total count for backward compatibility
    
    # Optional fields
    notes = Column(Text, nullable=True)
    
    # Reception tracking
    reception_number = Column(String(50), nullable=True, unique=True)  # Auto-generated reception number
    invoice_number = Column(String(100), nullable=True)  # Optional invoice number from user
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=True)  # Foreign key to user who created this record
    
    # Relationship to vehicles
    vehicles = relationship("Vehicle", back_populates="reception", cascade="all, delete-orphan")


class Vehicle(Base):
    """Model for individual vehicle details in a reception"""
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to reception
    reception_id = Column(Integer, ForeignKey("vehicle_receptions.id"), nullable=False)
    
    # Vehicle details
    vehicle_number = Column(String(100), nullable=False)  # رقم القاطرة و المقطورة
    vehicle_type = Column(String(50), nullable=False)  # فنطاس, قلاب, ترلا فرش, سيارات متنوع
    driver_name = Column(String(100), nullable=False)
    car_brand = Column(String(100), nullable=False)
    
    # Vehicle specific quantity (part of total)
    vehicle_quantity = Column(Float, nullable=False, default=0.0)
    
    # Order in the reception
    vehicle_order = Column(Integer, nullable=False, default=1)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationship back to reception
    reception = relationship("VehicleReception", back_populates="vehicles")


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