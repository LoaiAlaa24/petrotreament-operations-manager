from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, and_, or_
import models
import schemas
from database import get_db
from datetime import datetime
from routers.auth import get_current_user, require_admin_or_above

router = APIRouter()


@router.get("/", response_model=schemas.VehicleReceptionList)
async def get_vehicle_receptions(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at", pattern="^(date|company_name|created_at|total_quantity)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    company_filter: Optional[str] = Query(None),
    water_type_filter: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Get paginated list of vehicle receptions with filtering and sorting"""
    # Base query
    query = db.query(models.VehicleReception).filter(models.VehicleReception.is_active == True)
    
    # Apply filters
    if company_filter:
        query = query.filter(models.VehicleReception.company_name.ilike(f"%{company_filter}%"))
    
    if water_type_filter:
        query = query.filter(models.VehicleReception.water_type.ilike(f"%{water_type_filter}%"))
    
    if date_from and date_from.strip():
        try:
            date_from_dt = datetime.strptime(date_from.strip(), '%Y-%m-%d').date()
            query = query.filter(models.VehicleReception.date >= date_from_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid date_from format. Use YYYY-MM-DD"
            )
    
    if date_to and date_to.strip():
        try:
            date_to_dt = datetime.strptime(date_to.strip(), '%Y-%m-%d').date()
            query = query.filter(models.VehicleReception.date <= date_to_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    # Apply sorting
    sort_column = getattr(models.VehicleReception, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    
    # Calculate total pages
    pages = (total + size - 1) // size
    
    return schemas.VehicleReceptionList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{reception_id}", response_model=schemas.VehicleReception)
async def get_vehicle_reception(
    reception_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Get a specific vehicle reception by ID"""
    reception = db.query(models.VehicleReception).filter(
        models.VehicleReception.id == reception_id,
        models.VehicleReception.is_active == True
    ).first()
    
    if not reception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle reception not found"
        )
    
    return reception


@router.post("/enhanced", response_model=schemas.VehicleReception, status_code=status.HTTP_201_CREATED)
async def create_enhanced_vehicle_reception(
    reception_data: schemas.EnhancedVehicleReceptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Create a new enhanced vehicle reception record with multiple vehicles"""
    
    # Generate unique reception number
    import uuid
    reception_number = f"RCP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Calculate total number of vehicles
    number_of_vehicles = len(reception_data.vehicles)
    
    # Create reception record
    reception_dict = reception_data.dict(exclude={'vehicles'})
    reception_dict.update({
        'day_of_week': reception_data.date.strftime('%A'),
        'created_by': current_user.id,
        'reception_number': reception_number,
        'number_of_vehicles': number_of_vehicles
    })
    
    db_reception = models.VehicleReception(**reception_dict)
    db.add(db_reception)
    db.commit()
    db.refresh(db_reception)
    
    # Create vehicle records
    for vehicle_data in reception_data.vehicles:
        vehicle_dict = vehicle_data.dict()
        vehicle_dict['reception_id'] = db_reception.id
        
        db_vehicle = models.Vehicle(**vehicle_dict)
        db.add(db_vehicle)
    
    db.commit()
    
    # Refresh to get vehicles
    db.refresh(db_reception)
    
    return db_reception


@router.post("/", response_model=schemas.VehicleReception, status_code=status.HTTP_201_CREATED)
async def create_vehicle_reception(
    reception_data: schemas.VehicleReceptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Create a new vehicle reception record (backward compatibility)"""
    
    # Create new reception with auto-generated day_of_week and created_by
    reception_dict = reception_data.dict()
    reception_dict['day_of_week'] = reception_data.date.strftime('%A')  # e.g., 'Monday'
    reception_dict['created_by'] = current_user.id
    
    db_reception = models.VehicleReception(**reception_dict)
    
    db.add(db_reception)
    db.commit()
    db.refresh(db_reception)
    
    return db_reception


@router.put("/{reception_id}", response_model=schemas.VehicleReception)
async def update_vehicle_reception(
    reception_id: int,
    reception_data: schemas.VehicleReceptionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Update an existing vehicle reception record"""
    
    # Get existing reception
    db_reception = db.query(models.VehicleReception).filter(
        models.VehicleReception.id == reception_id,
        models.VehicleReception.is_active == True
    ).first()
    
    if not db_reception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle reception not found"
        )
    
    # Check permissions: admin can only edit their own records, super_admin can edit any
    if current_user.role == "admin" and db_reception.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit records you created"
        )
    
    # Update fields
    update_data = reception_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reception, field, value)
    
    # Auto-update day_of_week if date is being updated
    if 'date' in update_data:
        db_reception.day_of_week = update_data['date'].strftime('%A')
    
    db.commit()
    db.refresh(db_reception)
    
    return db_reception


@router.delete("/{reception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle_reception(
    reception_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Soft delete a vehicle reception record"""
    
    # Get existing reception
    db_reception = db.query(models.VehicleReception).filter(
        models.VehicleReception.id == reception_id,
        models.VehicleReception.is_active == True
    ).first()
    
    if not db_reception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle reception not found"
        )
    
    # Check permissions: admin can only delete their own records, super_admin can delete any
    if current_user.role == "admin" and db_reception.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete records you created"
        )
    
    # Soft delete
    db_reception.is_active = False
    db.commit()


@router.get("/stats/summary")
async def get_reception_stats(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_above)
):
    """Get summary statistics for vehicle receptions"""
    
    # Base query
    query = db.query(models.VehicleReception).filter(models.VehicleReception.is_active == True)
    
    # Apply date filters with proper parsing
    if date_from and date_from.strip():
        try:
            date_from_dt = datetime.strptime(date_from.strip(), '%Y-%m-%d').date()
            query = query.filter(models.VehicleReception.date >= date_from_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid date_from format. Use YYYY-MM-DD"
            )
    
    if date_to and date_to.strip():
        try:
            date_to_dt = datetime.strptime(date_to.strip(), '%Y-%m-%d').date()
            query = query.filter(models.VehicleReception.date <= date_to_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    receptions = query.all()
    
    if not receptions:
        return {
            "total_receptions": 0,
            "total_vehicles": 0,
            "total_quantity": 0,
            "companies": [],
            "water_types": []
        }
    
    # Calculate statistics
    total_receptions = len(receptions)
    total_vehicles = sum(r.number_of_vehicles for r in receptions)
    total_quantity = sum(r.total_quantity for r in receptions)
    
    # Get unique companies and water types
    companies = list(set(r.company_name for r in receptions))
    water_types = list(set(r.water_type for r in receptions))
    
    return {
        "total_receptions": total_receptions,
        "total_vehicles": total_vehicles,
        "total_quantity": total_quantity,
        "companies": companies,
        "water_types": water_types
    }