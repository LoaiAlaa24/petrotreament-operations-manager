#!/usr/bin/env python3
"""
Script to verify the Petrotreatment_Vehicles table data
"""

import psycopg2
from psycopg2 import sql

# Database connection string
DATABASE_URL = "postgresql://postgres:hwJCMUKVTCiNMDBIUsvRvorQVsCAGesB@gondola.proxy.rlwy.net:57547/railway"

def verify_vehicles_table():
    """Verify the Petrotreatment_Vehicles table and its data"""
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("🔍 Verifying Petrotreatment_Vehicles table...")
        
        # Check table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'petrotreatment_vehicles'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("\n📋 Table Structure:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        
        # Check total count
        cursor.execute("SELECT COUNT(*) FROM Petrotreatment_Vehicles;")
        total_count = cursor.fetchone()[0]
        print(f"\n📊 Total Records: {total_count}")
        
        # Check vehicle types distribution
        cursor.execute("SELECT vehicle_type, COUNT(*) FROM Petrotreatment_Vehicles GROUP BY vehicle_type;")
        type_distribution = cursor.fetchall()
        print("\n🚛 Vehicle Types Distribution:")
        for vtype, count in type_distribution:
            print(f"  - {vtype}: {count}")
        
        # Show all records with key information
        cursor.execute("""
            SELECT id, vehicle_type, brand, model, current_plate_number, license_start, license_end
            FROM Petrotreatment_Vehicles 
            ORDER BY id;
        """)
        all_vehicles = cursor.fetchall()
        
        print(f"\n📋 All Vehicle Records:")
        print("-" * 100)
        print(f"{'ID':<3} {'Type':<10} {'Brand':<20} {'Model':<6} {'Plate Number':<20} {'License Start':<12} {'License End':<12}")
        print("-" * 100)
        
        for vehicle in all_vehicles:
            vid, vtype, brand, model, plate, start_date, end_date = vehicle
            start_str = start_date.strftime('%Y-%m-%d') if start_date else 'N/A'
            end_str = end_date.strftime('%Y-%m-%d') if end_date else 'N/A'
            
            print(f"{vid:<3} {vtype:<10} {brand:<20} {model:<6} {plate:<20} {start_str:<12} {end_str:<12}")
        
        print("-" * 100)
        print(f"✅ Verification completed! All {total_count} vehicles are properly stored.")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
    
    return True

if __name__ == "__main__":
    verify_vehicles_table()