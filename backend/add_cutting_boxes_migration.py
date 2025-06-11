#!/usr/bin/env python3
"""
Database migration script to add cutting_boxes_amount column to vehicle_receptions table
"""

from database import engine
from sqlalchemy import text
import sys

def add_cutting_boxes_column():
    """Add cutting_boxes_amount column to vehicle_receptions table"""
    try:
        with engine.connect() as connection:
            # Check if column already exists
            result = connection.execute(text("""
                SELECT COUNT(*) as count 
                FROM pragma_table_info('vehicle_receptions') 
                WHERE name = 'cutting_boxes_amount'
            """))
            
            column_exists = result.fetchone()[0] > 0
            
            if column_exists:
                print("✅ cutting_boxes_amount column already exists in vehicle_receptions table")
                return True
            
            # Add the new column
            print("🔄 Adding cutting_boxes_amount column to vehicle_receptions table...")
            connection.execute(text("""
                ALTER TABLE vehicle_receptions 
                ADD COLUMN cutting_boxes_amount FLOAT NULL
            """))
            
            connection.commit()
            print("✅ Successfully added cutting_boxes_amount column to vehicle_receptions table")
            
            return True
            
    except Exception as e:
        print(f"❌ Error adding cutting_boxes_amount column: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting migration to add cutting_boxes_amount column...")
    success = add_cutting_boxes_column()
    
    if success:
        print("🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("💥 Migration failed!")
        sys.exit(1)