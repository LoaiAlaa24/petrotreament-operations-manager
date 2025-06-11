#!/usr/bin/env python3
"""
Database migration script to add cutting_boxes_amount column to Railway PostgreSQL database
"""

import psycopg2
import sys

# Railway database connection string
RAILWAY_DATABASE_URL = "postgresql://postgres:hwJCMUKVTCiNMDBIUsvRvorQVsCAGesB@gondola.proxy.rlwy.net:57547/railway"

def add_cutting_boxes_column_railway():
    """Add cutting_boxes_amount column to vehicle_receptions table in Railway PostgreSQL"""
    try:
        # Connect to Railway PostgreSQL database
        print("🔗 Connecting to Railway PostgreSQL database...")
        conn = psycopg2.connect(RAILWAY_DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if column already exists
        print("🔍 Checking if cutting_boxes_amount column exists...")
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'vehicle_receptions' 
            AND column_name = 'cutting_boxes_amount'
        """)
        
        column_exists = cursor.fetchone()[0] > 0
        
        if column_exists:
            print("✅ cutting_boxes_amount column already exists in vehicle_receptions table")
            cursor.close()
            conn.close()
            return True
        
        # Add the new column
        print("🔄 Adding cutting_boxes_amount column to vehicle_receptions table...")
        cursor.execute("""
            ALTER TABLE vehicle_receptions 
            ADD COLUMN cutting_boxes_amount FLOAT NULL
        """)
        
        conn.commit()
        print("✅ Successfully added cutting_boxes_amount column to vehicle_receptions table")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'vehicle_receptions' 
            AND column_name = 'cutting_boxes_amount'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Column verification: {result[0]} ({result[1]}, nullable: {result[2]})")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error adding cutting_boxes_amount column to Railway database: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 Starting Railway PostgreSQL migration to add cutting_boxes_amount column...")
    success = add_cutting_boxes_column_railway()
    
    if success:
        print("🎉 Railway PostgreSQL migration completed successfully!")
        sys.exit(0)
    else:
        print("💥 Railway PostgreSQL migration failed!")
        sys.exit(1)