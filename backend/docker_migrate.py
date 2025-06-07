#!/usr/bin/env python3
"""
Docker-compatible database migration script
This script can be run in the Docker container to update the PostgreSQL database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def get_database_url():
    """Get database URL from environment variables"""
    return os.getenv('DATABASE_URL', 'postgresql://user:password@postgres:5432/stationdb')

def migrate_postgresql():
    """Migrate PostgreSQL database in Docker environment"""
    
    database_url = get_database_url()
    print(f"🔄 Connecting to database: {database_url.split('@')[1] if '@' in database_url else 'hidden'}")
    
    try:
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("✅ Connected to database")
        
        # Check if vehicle_receptions.created_by column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='vehicle_receptions' AND column_name='created_by'
        """))
        
        if not result.fetchone():
            print("➕ Adding created_by column to vehicle_receptions table...")
            db.execute(text("ALTER TABLE vehicle_receptions ADD COLUMN created_by INTEGER"))
            db.commit()
            print("✅ Added created_by column to vehicle_receptions table")
        else:
            print("ℹ️  created_by column already exists in vehicle_receptions table")
        
        # Update user roles if needed
        print("🔄 Checking user roles...")
        old_roles_result = db.execute(text("""
            SELECT id, username, role 
            FROM users 
            WHERE role NOT IN ('super_admin', 'admin')
        """))
        
        old_role_users = old_roles_result.fetchall()
        
        if old_role_users:
            print(f"📝 Updating {len(old_role_users)} users with old roles...")
            for user in old_role_users:
                user_id, username, old_role = user
                new_role = 'admin'  # Default to admin
                
                db.execute(text("""
                    UPDATE users 
                    SET role = :new_role 
                    WHERE id = :user_id
                """), {"new_role": new_role, "user_id": user_id})
                
                print(f"   📝 Updated user '{username}': {old_role} → {new_role}")
            
            db.commit()
            print("✅ Updated user roles")
        else:
            print("ℹ️  All users have valid roles")
        
        # Create indexes
        try:
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_vehicle_receptions_created_by 
                ON vehicle_receptions(created_by)
            """))
            db.commit()
            print("✅ Created indexes")
        except Exception as e:
            print(f"⚠️  Index warning: {e}")
        
        db.close()
        print("✅ Migration completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate_postgresql()
    sys.exit(0 if success else 1)