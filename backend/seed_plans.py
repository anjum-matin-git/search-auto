"""
Seed script to create pricing plans in the database.
Run this once to initialize the plans.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from db.models import Plan

def seed_plans():
    """Create the three pricing plans."""
    db = SessionLocal()
    
    try:
        # Check if plans already exist
        existing = db.query(Plan).count()
        if existing > 0:
            print(f"Plans already exist ({existing} plans found). Skipping seed.")
            return
        
        plans = [
            Plan(
                name="Personal",
                price=5.00,
                credits=50,
                stripe_price_id="",  # Will be filled after Stripe product creation
                features={
                    "searches": 50,
                    "ai_powered": True,
                    "basic_support": True
                }
            ),
            Plan(
                name="Pro",
                price=25.00,
                credits=None,  # Unlimited
                stripe_price_id="",  # Will be filled after Stripe product creation
                features={
                    "searches": "unlimited",
                    "ai_powered": True,
                    "priority_support": True,
                    "advanced_filters": True
                }
            ),
            Plan(
                name="Premium",
                price=0.00,  # Contact sales
                credits=None,  # Unlimited
                stripe_price_id="",  # Custom, no Stripe price
                features={
                    "searches": "unlimited",
                    "ai_powered": True,
                    "dedicated_support": True,
                    "dealer_connection": True,
                    "purchase_assistance": True,
                    "white_glove_service": True
                }
            )
        ]
        
        db.add_all(plans)
        db.commit()
        
        print("✅ Successfully created 3 pricing plans:")
        for plan in plans:
            print(f"  - {plan.name}: ${plan.price} ({plan.credits or 'unlimited'} credits)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding plans: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_plans()
