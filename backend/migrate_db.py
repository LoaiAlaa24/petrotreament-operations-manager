#!/usr/bin/env python3
"""
Database migration script to add created_by columns
Run this script to update the database schema for the new role system
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
import models
from database import engine

def migrate_database():
    """Add created_by columns to existing tables"""
    
    print("🔄 Starting database migration...")
    
    try:
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Users table doesn't need created_by column - users are created by system/admin
        print("ℹ️  Users table doesn't need created_by column")
        
        # Check if vehicle_receptions.created_by column already exists
        # Handle both PostgreSQL and SQLite
        if settings.database_url.startswith('postgresql'):
            # PostgreSQL
            result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='vehicle_receptions' AND column_name='created_by'
            """))
        else:
            # SQLite
            result = db.execute(text("""
                PRAGMA table_info(vehicle_receptions)
            """))
            columns = [row[1] for row in result.fetchall()]
            has_column = 'created_by' in columns
            result = [True] if has_column else []
        
        column_exists = False
        if settings.database_url.startswith('postgresql'):
            column_exists = bool(result.fetchone())
        else:
            column_exists = bool(result)
        
        if not column_exists:
            print("➕ Adding created_by column to vehicle_receptions table...")
            db.execute(text("ALTER TABLE vehicle_receptions ADD COLUMN created_by INTEGER"))
            db.commit()
            print("✅ Added created_by column to vehicle_receptions table")
        else:
            print("ℹ️  created_by column already exists in vehicle_receptions table")
        
        # Update existing users to have the new role system (if needed)
        print("🔄 Updating existing user roles...")
        
        # Check if there are any users with old roles that need updating
        old_roles_result = db.execute(text("""
            SELECT id, username, role 
            FROM users 
            WHERE role NOT IN ('super_admin', 'admin')
        """))
        
        old_role_users = old_roles_result.fetchall()
        
        if old_role_users:
            print(f"📝 Found {len(old_role_users)} users with old roles, updating...")
            for user in old_role_users:
                user_id, username, old_role = user
                # Convert old roles to new system
                if old_role in ['admin', 'super_admin']:
                    new_role = old_role
                else:
                    new_role = 'admin'  # Default to admin for any other role
                
                db.execute(text("""
                    UPDATE users 
                    SET role = :new_role 
                    WHERE id = :user_id
                """), {"new_role": new_role, "user_id": user_id})
                
                print(f"   📝 Updated user '{username}': {old_role} → {new_role}")
            
            db.commit()
            print("✅ Updated user roles")
        else:
            print("ℹ️  All users already have valid roles")
        
        # Create any missing indexes
        print("🔄 Creating indexes...")
        
        try:
            if settings.database_url.startswith('postgresql'):
                db.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_vehicle_receptions_created_by ON vehicle_receptions(created_by)
                """))
            else:
                # SQLite
                db.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_vehicle_receptions_created_by ON vehicle_receptions(created_by)
                """))
            db.commit()
            print("✅ Created indexes")
        except Exception as e:
            print(f"⚠️  Index creation warning (may already exist): {e}")
        
        db.close()
        
        print("✅ Database migration completed successfully!")
        print("\n📋 Summary:")
        print("   ✓ Added created_by columns")
        print("   ✓ Updated user roles to new system") 
        print("   ✓ Created necessary indexes")
        print("\n🔐 Role System:")
        print("   • super_admin: Full access including financial reports")
        print("   • admin: Can only edit own records, no financial access")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("🔧 Troubleshooting:")
        print("   1. Ensure the database is running")
        print("   2. Check database connection settings in config.py")
        print("   3. Verify user has proper database permissions")
        return False
    
    return True

if __name__ == "__main__":
    migrate_database()