from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator


# Vehicle schemas
class VehicleBase(BaseModel):
    """Base schema for individual vehicle"""
    vehicle_number: str = Field(..., max_length=100)
    vehicle_type: str = Field(..., max_length=50)
    driver_name: str = Field(..., max_length=100)
    car_brand: str = Field(..., max_length=100)
    vehicle_quantity: float = Field(..., ge=0)
    vehicle_order: int = Field(..., ge=1)


class VehicleCreate(VehicleBase):
    """Schema for creating vehicle"""
    pass


class VehicleUpdate(BaseModel):
    """Schema for updating vehicle"""
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    driver_name: Optional[str] = None
    car_brand: Optional[str] = None
    vehicle_quantity: Optional[float] = None
    vehicle_order: Optional[int] = None


class Vehicle(VehicleBase):
    """Schema for vehicle response"""
    id: int
    reception_id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# Reception schemas (updated)
class VehicleReceptionBase(BaseModel):
    """Base schema for vehicle reception"""
    date: datetime
    company_name: str = Field(..., max_length=100)
    water_type: str = Field(..., max_length=50)
    total_quantity: float = Field(..., ge=0)
    arrival_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    exit_time_drilling: Optional[datetime] = None
    notes: Optional[str] = None
    invoice_number: Optional[str] = Field(None, max_length=100)


class EnhancedVehicleReceptionCreate(VehicleReceptionBase):
    """Schema for creating enhanced vehicle reception with multiple vehicles"""
    vehicles: List[VehicleCreate] = Field(..., min_items=1)


class VehicleReceptionCreate(VehicleReceptionBase):
    """Schema for creating simple vehicle reception (backward compatibility)"""
    number_of_vehicles: int = Field(..., ge=1)


class VehicleReceptionUpdate(BaseModel):
    """Schema for updating vehicle reception record"""
    date: Optional[datetime] = None
    company_name: Optional[str] = None
    number_of_vehicles: Optional[int] = None
    water_type: Optional[str] = None
    total_quantity: Optional[float] = None
    arrival_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    exit_time_drilling: Optional[datetime] = None
    notes: Optional[str] = None
    invoice_number: Optional[str] = None


class VehicleReception(VehicleReceptionBase):
    """Schema for vehicle reception response"""
    id: int
    number_of_vehicles: int  # Calculated from vehicles
    day_of_week: str  # This will be auto-generated from date
    reception_number: Optional[str] = None
    invoice_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    created_by: Optional[int] = None
    vehicles: List[Vehicle] = []
    
    class Config:
        from_attributes = True


class VehicleReceptionList(BaseModel):
    """Schema for paginated vehicle reception list"""
    items: list[VehicleReception]
    total: int
    page: int
    size: int
    pages: int


class UserBase(BaseModel):
    """Base schema for user"""
    username: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)
    full_name: Optional[str] = None
    role: str = Field(default="admin", max_length=20)  # super_admin, admin


class UserCreate(UserBase):
    """Schema for creating user"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema for updating user"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None


class ReportRequest(BaseModel):
    """Schema for report generation request"""
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    report_type: str = Field(..., pattern="^(daily|weekly|monthly)$")
    company_filter: Optional[str] = None
    water_type_filter: Optional[str] = None


class FinancialReportRequest(BaseModel):
    """Schema for financial report generation request"""
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    company_filter: Optional[str] = None


class CompanyFinancialSummary(BaseModel):
    """Schema for company financial summary"""
    company_name: str
    total_volume_m3: float
    rate_per_m3: float
    total_cost: float
    reception_count: int


class FinancialReportSummary(BaseModel):
    """Schema for financial report summary"""
    period_start: str
    period_end: str
    companies: list[CompanyFinancialSummary]
    total_volume_m3: float
    total_cost: float
    generated_at: datetime


class CompanyRateConfig(BaseModel):
    """Schema for company rate configuration"""
    company_name: str
    rate_per_m3: float


class CompanyRatesResponse(BaseModel):
    """Schema for company rates response"""
    rates: dict[str, float]
    default_rate: float