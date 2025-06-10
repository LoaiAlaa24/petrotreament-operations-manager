#!/usr/bin/env python3
"""
Database migration script for Enhanced Vehicle Reception System
This script adds the new Vehicle table and updates the VehicleReception table
to support multiple vehicles per reception with detailed information.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
import models
from database import engine

def migrate_enhanced_reception():
    """Migrate database for enhanced vehicle reception system"""
    
    print("🔄 Starting Enhanced Vehicle Reception migration...")
    
    try:
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if we're using PostgreSQL or SQLite
        is_postgresql = settings.database_url.startswith('postgresql')
        
        print(f"📊 Database type: {'PostgreSQL' if is_postgresql else 'SQLite'}")
        
        # 1. Check if Vehicle table exists
        print("🔍 Checking if Vehicle table exists...")
        
        if is_postgresql:
            table_check = db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'vehicles'
                )
            """))
            table_exists = table_check.scalar()
        else:
            table_check = db.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='vehicles'
            """))
            table_exists = bool(table_check.fetchone())
        
        if not table_exists:
            print("➕ Creating Vehicle table...")
            
            if is_postgresql:
                db.execute(text("""
                    CREATE TABLE vehicles (
                        id SERIAL PRIMARY KEY,
                        reception_id INTEGER NOT NULL REFERENCES vehicle_receptions(id) ON DELETE CASCADE,
                        vehicle_number VARCHAR(100) NOT NULL,
                        vehicle_type VARCHAR(50) NOT NULL,
                        driver_name VARCHAR(100) NOT NULL,
                        car_brand VARCHAR(100) NOT NULL,
                        vehicle_quantity FLOAT NOT NULL DEFAULT 0.0,
                        vehicle_order INTEGER NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_active BOOLEAN DEFAULT TRUE
                    )
                """))
            else:
                db.execute(text("""
                    CREATE TABLE vehicles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        reception_id INTEGER NOT NULL REFERENCES vehicle_receptions(id) ON DELETE CASCADE,
                        vehicle_number VARCHAR(100) NOT NULL,
                        vehicle_type VARCHAR(50) NOT NULL,
                        driver_name VARCHAR(100) NOT NULL,
                        car_brand VARCHAR(100) NOT NULL,
                        vehicle_quantity REAL NOT NULL DEFAULT 0.0,
                        vehicle_order INTEGER NOT NULL DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        is_active BOOLEAN DEFAULT 1
                    )
                """))
            
            db.commit()
            print("✅ Created Vehicle table")
        else:
            print("ℹ️  Vehicle table already exists")
        
        # 2. Check if reception_number column exists in vehicle_receptions
        print("🔍 Checking reception_number column...")
        
        if is_postgresql:
            column_check = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='vehicle_receptions' AND column_name='reception_number'
            """))
            column_exists = bool(column_check.fetchone())
        else:
            column_check = db.execute(text("PRAGMA table_info(vehicle_receptions)"))
            columns = [row[1] for row in column_check.fetchall()]
            column_exists = 'reception_number' in columns
        
        if not column_exists:
            print("➕ Adding reception_number column to vehicle_receptions...")
            # For SQLite, we can't add a UNIQUE column directly, so add it first then create index
            if is_postgresql:
                db.execute(text("""
                    ALTER TABLE vehicle_receptions 
                    ADD COLUMN reception_number VARCHAR(50) UNIQUE
                """))
            else:
                # SQLite: Add column without UNIQUE constraint first
                db.execute(text("""
                    ALTER TABLE vehicle_receptions 
                    ADD COLUMN reception_number VARCHAR(50)
                """))
            db.commit()
            print("✅ Added reception_number column")
        else:
            print("ℹ️  reception_number column already exists")
        
        # 3. Create indexes for better performance
        print("🔄 Creating indexes...")
        
        try:
            # Index on reception_id for vehicles table
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_vehicles_reception_id 
                ON vehicles(reception_id)
            """))
            
            # Index on vehicle_order for vehicles table
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_vehicles_order 
                ON vehicles(reception_id, vehicle_order)
            """))
            
            # Index on reception_number for vehicle_receptions table
            # For SQLite, create unique index to enforce uniqueness
            if is_postgresql:
                db.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_vehicle_receptions_reception_number 
                    ON vehicle_receptions(reception_number)
                """))
            else:
                db.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_receptions_reception_number 
                    ON vehicle_receptions(reception_number)
                """))
            
            # Index on vehicle_type for filtering
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_vehicles_type 
                ON vehicles(vehicle_type)
            """))
            
            db.commit()
            print("✅ Created performance indexes")
        except Exception as e:
            print(f"⚠️  Index creation warning (may already exist): {e}")
        
        # 4. Generate reception numbers for existing records (if any)
        print("🔄 Generating reception numbers for existing records...")
        
        existing_receptions = db.execute(text("""
            SELECT id, date FROM vehicle_receptions 
            WHERE reception_number IS NULL
        """)).fetchall()
        
        if existing_receptions:
            print(f"📝 Found {len(existing_receptions)} receptions without reception numbers")
            
            for reception in existing_receptions:
                reception_id, date = reception
                
                # Generate reception number: RCP-YYYYMMDD-ID
                if hasattr(date, 'strftime'):
                    date_str = date.strftime('%Y%m%d')
                else:
                    # Handle string dates
                    date_str = str(date)[:10].replace('-', '')
                
                reception_number = f"RCP-{date_str}-{reception_id:04d}"
                
                db.execute(text("""
                    UPDATE vehicle_receptions 
                    SET reception_number = :reception_number 
                    WHERE id = :reception_id
                """), {
                    "reception_number": reception_number,
                    "reception_id": reception_id
                })
            
            db.commit()
            print("✅ Generated reception numbers for existing records")
        else:
            print("ℹ️  No existing records need reception numbers")
        
        # 5. Add triggers for updated_at (PostgreSQL only)
        if is_postgresql:
            print("🔄 Creating updated_at trigger for vehicles table...")
            try:
                # Create trigger function if it doesn't exist
                db.execute(text("""
                    CREATE OR REPLACE FUNCTION update_updated_at_column()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = CURRENT_TIMESTAMP;
                        RETURN NEW;
                    END;
                    $$ language 'plpgsql';
                """))
                
                # Create trigger for vehicles table
                db.execute(text("""
                    DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
                    CREATE TRIGGER update_vehicles_updated_at
                        BEFORE UPDATE ON vehicles
                        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                """))
                
                db.commit()
                print("✅ Created updated_at trigger")
            except Exception as e:
                print(f"⚠️  Trigger creation warning: {e}")
        
        db.close()
        
        print("✅ Enhanced Vehicle Reception migration completed successfully!")
        print("\n📋 Migration Summary:")
        print("   ✓ Created Vehicle table with detailed vehicle information")
        print("   ✓ Added reception_number column for unique tracking")
        print("   ✓ Created performance indexes")
        print("   ✓ Generated reception numbers for existing records")
        if is_postgresql:
            print("   ✓ Created database triggers for automatic timestamps")
        
        print("\n🚗 Enhanced Features Added:")
        print("   • Multiple vehicles per reception")
        print("   • Individual vehicle details (number, type, driver, brand)")
        print("   • Vehicle quantity tracking")
        print("   • Unique reception number generation")
        print("   • Improved data relationships and integrity")
        
        print("\n🎯 Vehicle Types Supported:")
        print("   • فنطاس (Tank truck)")
        print("   • قلاب (Dump truck)")  
        print("   • ترلا فرش (Flatbed truck)")
        print("   • سيارات متنوع (Mixed vehicles)")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔧 Troubleshooting:")
        print("   1. Ensure the database is running")
        print("   2. Check database connection settings")
        print("   3. Verify user has proper database permissions")
        print("   4. Check if foreign key constraints are supported")
        return False
    
    return True

if __name__ == "__main__":
    success = migrate_enhanced_reception()
    if success:
        print("\n🎉 Migration completed! You can now use the enhanced vehicle reception system.")
        print("🔗 Access the enhanced form at: /enhanced-reception")
    else:
        print("\n❌ Migration failed. Please check the errors above and try again.")
        exit(1)