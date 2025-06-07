#!/usr/bin/env python3
"""
Script to create a default admin user
Run this script to set up initial admin access
"""

import asyncio
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
import models
from database import engine
from config import settings

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_users():
    """Create default super admin and admin users if they don't exist"""
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if super admin user exists
        existing_super_admin = db.query(models.User).filter(
            models.User.username == "superadmin"
        ).first()
        
        if not existing_super_admin:
            # Create super admin user
            hashed_password = pwd_context.hash("super123admin")
            super_admin_user = models.User(
                username="superadmin",
                email="superadmin@petrotreatment.local",
                full_name="Super Administrator",
                hashed_password=hashed_password,
                role="super_admin",
                is_active=True
            )
            
            db.add(super_admin_user)
            db.commit()
            
            print("✅ Super Admin user created successfully!")
            print("Username: superadmin")
            print("Password: super123admin")
            print("Role: super_admin (can access everything, including financial reports)")
        else:
            print("Super Admin user already exists!")
        
        # Check if admin user exists
        existing_admin = db.query(models.User).filter(
            models.User.username == "admin"
        ).first()
        
        if not existing_admin:
            # Create admin user
            hashed_password = pwd_context.hash("admin123")
            admin_user = models.User(
                username="admin",
                email="admin@petrotreatment.local",
                full_name="Administrator",
                hashed_password=hashed_password,
                role="admin",
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            
            print("✅ Admin user created successfully!")
            print("Username: admin")
            print("Password: admin123")
            print("Role: admin (can edit/delete only own records, no financial reports)")
        else:
            print("Admin user already exists!")
        
        print("\n⚠️  Please change the default passwords after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_users()