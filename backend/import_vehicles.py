#!/usr/bin/env python3
"""
Script to create Petrotreatment_Vehicles table and import vehicle data
"""

import psycopg2
from psycopg2 import sql
import os

# Database connection string
DATABASE_URL = "postgresql://postgres:hwJCMUKVTCiNMDBIUsvRvorQVsCAGesB@gondola.proxy.rlwy.net:57547/railway"

def create_vehicles_table():
    """Create the Petrotreatment_Vehicles table and import data"""
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Connected to database successfully!")
        
        # Read the SQL file
        sql_file_path = os.path.join(os.path.dirname(__file__), 'create_vehicles_table.sql')
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_commands = f.read()
        
        # Execute the SQL commands
        cursor.execute(sql_commands)
        conn.commit()
        
        print("Table created and data imported successfully!")
        
        # Verify the data
        cursor.execute("SELECT COUNT(*) FROM Petrotreatment_Vehicles;")
        count = cursor.fetchone()[0]
        print(f"Total vehicles imported: {count}")
        
        # Show sample data
        cursor.execute("SELECT vehicle_type, brand, model, current_plate_number FROM Petrotreatment_Vehicles LIMIT 5;")
        rows = cursor.fetchall()
        print("\nSample data:")
        for row in rows:
            print(f"Type: {row[0]}, Brand: {row[1]}, Model: {row[2]}, Plate: {row[3]}")
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
    
    return True

if __name__ == "__main__":
    success = create_vehicles_table()
    if success:
        print("\n✅ Vehicle table creation and data import completed successfully!")
    else:
        print("\n❌ Failed to create table or import data.")