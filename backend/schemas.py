from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


class VehicleReceptionBase(BaseModel):
    """Base schema for vehicle reception"""
    date: datetime
    company_name: str = Field(..., max_length=100)
    number_of_vehicles: int = Field(..., ge=1)
    water_type: str = Field(..., max_length=50)
    total_quantity: float = Field(..., ge=0)
    arrival_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    exit_time_drilling: Optional[datetime] = None
    notes: Optional[str] = None


class VehicleReceptionCreate(VehicleReceptionBase):
    """Schema for creating vehicle reception record"""
    pass


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


class VehicleReception(VehicleReceptionBase):
    """Schema for vehicle reception response"""
    id: int
    day_of_week: str  # This will be auto-generated from date
    created_at: datetime
    updated_at: datetime
    is_active: bool
    created_by: Optional[int] = None
    
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