"""
Create a test superuser with unlimited credits for testing.
Run this script to create: test@searchauto.ai / password123
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from db.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_superuser():
    """Create a test user with unlimited searches."""
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == "test@searchauto.ai").first()
        if existing:
            print(f"✅ Test superuser already exists: test@searchauto.ai")
            print(f"   Username: {existing.username}")
            print(f"   Unlimited searches: {existing.unlimited_searches}")
            print(f"   Credits: {existing.credits_remaining}")
            return
        
        # Create superuser
        hashed_password = pwd_context.hash("password123")
        
        superuser = User(
            username="testsuperuser",
            email="test@searchauto.ai",
            password=hashed_password,
            location="San Francisco, CA",
            postal_code="94105",
            credits_remaining=999999,  # Essentially unlimited
            unlimited_searches=True    # Pro/Premium level access
        )
        
        db.add(superuser)
        db.commit()
        db.refresh(superuser)
        
        print("✅ Test superuser created successfully!")
        print(f"\n📧 Email: test@searchauto.ai")
        print(f"🔑 Password: password123")
        print(f"👤 Username: testsuperuser")
        print(f"💎 Plan: Unlimited searches (Pro-level)")
        print(f"🎟️  Credits: {superuser.credits_remaining}")
        print(f"\nUse these credentials to test the payment flow!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test superuser: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_superuser()
