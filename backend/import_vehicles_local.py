#!/usr/bin/env python3
"""
Script to create Petrotreatment_Vehicles table and import vehicle data to local database
"""

import sqlite3
import os
from database import engine
from models import Base, PetrotreatmentVehicle
from sqlalchemy.orm import sessionmaker

def create_vehicles_table_local():
    """Create the Petrotreatment_Vehicles table and import data to local database"""
    try:
        # Create all tables (including the new PetrotreatmentVehicle table)
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        print("Connected to local database successfully!")
        
        # Check if data already exists
        existing_count = session.query(PetrotreatmentVehicle).count()
        if existing_count > 0:
            print(f"Found {existing_count} existing vehicles. Clearing them first...")
            session.query(PetrotreatmentVehicle).delete()
            session.commit()
        
        # Insert the vehicle data
        vehicles_data = [
            {
                'vehicle_type': 'قاطرة',
                'brand': 'مرسيدس',
                'model': '1979',
                'previous_plate_number': '12311',
                'current_plate_number': '9213 / ط ب ل',
                'engine_number': '582',
                'chassis_number': '14/454990',
                'license_start': None,
                'license_end': '2022-09-14'
            },
            {
                'vehicle_type': 'قاطرة',
                'brand': 'إفيكو / ماجيـروس',
                'model': '1982',
                'previous_plate_number': '11895 352/ل ب د',
                'current_plate_number': '6745 / ط ب ر',
                'engine_number': '9652',
                'chassis_number': 'X40/82/5/11',
                'license_start': None,
                'license_end': '2021-01-04'
            },
            {
                'vehicle_type': 'قاطرة',
                'brand': 'إفيكو صفراء',
                'model': '2004',
                'previous_plate_number': '4236 / ط ع ي',
                'current_plate_number': '1486 / ص د ص',
                'engine_number': '52723',
                'chassis_number': '4278472',
                'license_start': None,
                'license_end': '2024-08-20'
            },
            {
                'vehicle_type': 'قاطرة',
                'brand': 'إفيكو بيضاء',
                'model': '2002',
                'previous_plate_number': '9986 / ط ع ل',
                'current_plate_number': '1645 / ص د ص',
                'engine_number': '22734',
                'chassis_number': '4247016',
                'license_start': None,
                'license_end': '2024-10-12'
            },
            {
                'vehicle_type': 'مقطورة',
                'brand': 'الرضوى احمر',
                'model': '2010',
                'previous_plate_number': '7358 / ط ع ب',
                'current_plate_number': '4932 / ص د ل',
                'engine_number': None,
                'chassis_number': '265/2010/30/1',
                'license_start': None,
                'license_end': '2024-11-05'
            },
            {
                'vehicle_type': 'مقطورة',
                'brand': 'كرونا النيل',
                'model': '2010',
                'previous_plate_number': None,
                'current_plate_number': '7362 / ط ع ب',
                'engine_number': None,
                'chassis_number': '2010/600/33/106',
                'license_start': None,
                'license_end': '2021-07-10'
            },
            {
                'vehicle_type': 'مقطورة',
                'brand': 'إباطة فطاطس',
                'model': '1998',
                'previous_plate_number': '3916 / ط ع ه',
                'current_plate_number': '4857 / ص د ل',
                'engine_number': None,
                'chassis_number': '35/98/1500/249',
                'license_start': None,
                'license_end': '2024-08-30'
            },
            {
                'vehicle_type': 'مقطورة',
                'brand': 'بريما فطاطس',
                'model': '2009',
                'previous_plate_number': None,
                'current_plate_number': '5398 / ط ع ر',
                'engine_number': None,
                'chassis_number': '612/1050/09/70',
                'license_start': None,
                'license_end': '2025-09-01'
            }
        ]
        
        # Convert date strings to date objects where needed
        from datetime import datetime
        for vehicle_data in vehicles_data:
            if vehicle_data['license_end']:
                vehicle_data['license_end'] = datetime.strptime(vehicle_data['license_end'], '%Y-%m-%d').date()
            if vehicle_data['license_start']:
                vehicle_data['license_start'] = datetime.strptime(vehicle_data['license_start'], '%Y-%m-%d').date()
        
        # Create vehicle objects and add to session
        for vehicle_data in vehicles_data:
            vehicle = PetrotreatmentVehicle(**vehicle_data)
            session.add(vehicle)
        
        session.commit()
        
        print("Table created and data imported successfully!")
        
        # Verify the data
        count = session.query(PetrotreatmentVehicle).count()
        print(f"Total vehicles imported: {count}")
        
        # Show sample data
        vehicles = session.query(PetrotreatmentVehicle).limit(5).all()
        print("\nSample data:")
        for vehicle in vehicles:
            print(f"Type: {vehicle.vehicle_type}, Brand: {vehicle.brand}, Model: {vehicle.model}, Plate: {vehicle.current_plate_number}")
        
        session.close()
        
    except Exception as e:
        print(f"Error: {e}")
        if 'session' in locals():
            session.rollback()
            session.close()
        return False
    
    return True

if __name__ == "__main__":
    success = create_vehicles_table_local()
    if success:
        print("\n✅ Vehicle table creation and data import completed successfully!")
    else:
        print("\n❌ Failed to create table or import data.")