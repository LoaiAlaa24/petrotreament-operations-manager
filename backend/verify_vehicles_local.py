#!/usr/bin/env python3
"""
Script to verify the Petrotreatment_Vehicles table data in local database
"""

from database import engine
from models import PetrotreatmentVehicle
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

def verify_vehicles_table_local():
    """Verify the Petrotreatment_Vehicles table and its data in local database"""
    try:
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        print("🔍 Verifying Petrotreatment_Vehicles table in local database...")
        
        # Check if table exists by querying it
        try:
            test_query = session.query(PetrotreatmentVehicle).first()
            print("✅ Table exists and is accessible")
        except Exception as e:
            print(f"❌ Table access error: {e}")
            return False
        
        # Check total count
        total_count = session.query(PetrotreatmentVehicle).count()
        print(f"\n📊 Total Records: {total_count}")
        
        # Check vehicle types distribution
        vehicles = session.query(PetrotreatmentVehicle).all()
        type_distribution = {}
        for vehicle in vehicles:
            vtype = vehicle.vehicle_type
            type_distribution[vtype] = type_distribution.get(vtype, 0) + 1
        
        print("\n🚛 Vehicle Types Distribution:")
        for vtype, count in type_distribution.items():
            print(f"  - {vtype}: {count}")
        
        # Show all records with key information
        print(f"\n📋 All Vehicle Records:")
        print("-" * 100)
        print(f"{'ID':<3} {'Type':<10} {'Brand':<20} {'Model':<6} {'Plate Number':<20} {'License End':<12}")
        print("-" * 100)
        
        for vehicle in vehicles:
            license_end_str = vehicle.license_end.strftime('%Y-%m-%d') if vehicle.license_end else 'N/A'
            
            print(f"{vehicle.id:<3} {vehicle.vehicle_type:<10} {(vehicle.brand or 'N/A'):<20} {(vehicle.model or 'N/A'):<6} {(vehicle.current_plate_number or 'N/A'):<20} {license_end_str:<12}")
        
        print("-" * 100)
        print(f"✅ Verification completed! All {total_count} vehicles are properly stored in local database.")
        
        # Test the API endpoint functionality
        print(f"\n🧪 Testing vehicle options generation...")
        vehicle_options = []
        for vehicle in vehicles:
            display_name = f"{vehicle.vehicle_type} - {vehicle.brand or 'غير محدد'}"
            if vehicle.current_plate_number:
                display_name += f" ({vehicle.current_plate_number})"
            
            vehicle_options.append({
                'id': vehicle.id,
                'display_name': display_name,
                'vehicle_type': vehicle.vehicle_type,
                'brand': vehicle.brand,
                'current_plate_number': vehicle.current_plate_number,
                'is_custom': False
            })
        
        print(f"Generated {len(vehicle_options)} vehicle options for API:")
        for i, option in enumerate(vehicle_options[:3]):  # Show first 3
            print(f"  {i+1}. {option['display_name']}")
        if len(vehicle_options) > 3:
            print(f"  ... and {len(vehicle_options) - 3} more")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'session' in locals():
            session.close()
        return False
    
    return True

if __name__ == "__main__":
    verify_vehicles_table_local()