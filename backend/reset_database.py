#!/usr/bin/env python3
"""
Database reset script for Enhanced Vehicle Reception System
This script will drop all tables and recreate them with the new schema.
"""

import os
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker
import models
from database import Base

# Production database URL
DATABASE_URL = "postgresql://postgres:hwJCMUKVTCiNMDBIUsvRvorQVsCAGesB@gondola.proxy.rlwy.net:57547/railway"

def reset_database():
    """Drop all tables and recreate with new schema"""
    
    print("🔄 Starting database reset...")
    print(f"📊 Database URL: {DATABASE_URL[:50]}...")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        print("🗑️  Dropping all existing tables...")
        
        # Drop all tables
        with engine.begin() as conn:
            # Get all table names
            result = conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename NOT LIKE 'pg_%'
                AND tablename NOT LIKE 'sql_%'
            """))
            
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 Found {len(tables)} tables to drop: {tables}")
            
            # Drop tables with CASCADE to handle foreign keys
            for table in tables:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"   ✅ Dropped table: {table}")
        
        print("🏗️  Creating new schema...")
        
        # Create all tables with new schema
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database reset completed successfully!")
        print("\n📋 New Schema Created:")
        print("   ✓ vehicle_receptions table with reception_number column")
        print("   ✓ vehicles table for enhanced reception system")
        print("   ✓ users table for authentication")
        print("   ✓ All foreign key relationships established")
        
        print("\n🎯 Enhanced Features Available:")
        print("   • Multiple vehicles per reception")
        print("   • Individual vehicle details (number, type, driver, brand)")
        print("   • Vehicle quantity tracking")
        print("   • Unique reception number generation")
        print("   • Improved data relationships and integrity")
        
        print("\n🚗 Vehicle Types Supported:")
        print("   • فنطاس (Tank truck)")
        print("   • قلاب (Dump truck)")  
        print("   • ترلا فرش (Flatbed truck)")
        print("   • سيارات متنوع (Mixed vehicles)")
        
        # Verify tables were created
        with engine.begin() as conn:
            result = conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public' 
                ORDER BY tablename
            """))
            
            new_tables = [row[0] for row in result.fetchall()]
            print(f"\n📊 Verification - Created {len(new_tables)} tables:")
            for table in new_tables:
                print(f"   ✓ {table}")
        
    except Exception as e:
        print(f"❌ Database reset failed: {e}")
        print("🔧 Troubleshooting:")
        print("   1. Ensure the database URL is correct")
        print("   2. Check database connection permissions")
        print("   3. Verify PostgreSQL server is accessible")
        return False
    
    return True

if __name__ == "__main__":
    print("⚠️  WARNING: This will permanently delete ALL data in the database!")
    print("🎯 This action cannot be undone.")
    print(f"📊 Target database: {DATABASE_URL[:50]}...")
    
    # Uncomment the line below to actually run the reset
    # For safety, requiring manual confirmation
    confirm = input("\nType 'RESET' to confirm and proceed: ")
    
    if confirm == "RESET":
        success = reset_database()
        if success:
            print("\n🎉 Database reset completed! You can now use the enhanced vehicle reception system.")
            print("🔗 The application will have a clean slate with the new schema.")
        else:
            print("\n❌ Database reset failed. Please check the errors above and try again.")
    else:
        print("❌ Reset cancelled. Database unchanged.")