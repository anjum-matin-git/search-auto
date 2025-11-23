#!/usr/bin/env python3
"""
Stripe Product Creation Script for SearchAuto

This script creates the pricing plans in your Stripe account and updates
the database with the Stripe price IDs.

IMPORTANT: Add your Stripe API keys to Replit Secrets first:
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- JWT_SECRET_KEY

Then run: python backend/scripts/setup_stripe.py
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import stripe
from db.base import get_db
from db.models import Plan
from core.logging import get_logger

logger = get_logger(__name__)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY") or os.getenv("STRIPE_API_KEY")


def create_products():
    """Create Stripe products and update database."""
    
    # Check if Stripe keys are configured
    if not os.getenv("STRIPE_SECRET_KEY"):
        print("❌ ERROR: STRIPE_SECRET_KEY not found in environment")
        print("\n📝 Please add your Stripe API keys to Replit Secrets:")
        print("   1. Click the 🔒 Secrets tab in Replit")
        print("   2. Add STRIPE_SECRET_KEY with your key from Stripe Dashboard")
        print("   3. Add STRIPE_PUBLISHABLE_KEY")
        print("   4. Add JWT_SECRET_KEY (any random 32+ char string)")
        print("\n💡 Get your keys from: https://dashboard.stripe.com/test/apikeys")
        return False
    
    try:
        # Get database session
        db = next(get_db())
        
        print("\n🚀 Creating Stripe products for SearchAuto...\n")
        
        # 1. Create Personal Plan ($5 one-time, 50 credits)
        print("📦 Creating Personal Plan...")
        personal_plan = db.query(Plan).filter(Plan.name == "Personal").first()
        
        if personal_plan:
            # Create product
            product = stripe.Product.create(
                name="SearchAuto Personal",
                description="50 car search credits - perfect for occasional searches"
            )
            
            # Create price
            price = stripe.Price.create(
                product=product.id,
                unit_amount=500,  # $5.00 in cents
                currency="usd",
                metadata={"plan_id": personal_plan.id, "credits": 50}
            )
            
            # Update database
            personal_plan.stripe_price_id = price.id
            db.commit()
            
            print(f"   ✅ Personal Plan created! Price ID: {price.id}")
        
        # 2. Create Pro Plan ($25/month subscription, unlimited)
        print("📦 Creating Pro Plan...")
        pro_plan = db.query(Plan).filter(Plan.name == "Pro").first()
        
        if pro_plan:
            # Create product
            product = stripe.Product.create(
                name="SearchAuto Pro",
                description="Unlimited car searches every month - for serious car buyers"
            )
            
            # Create price (recurring monthly)
            price = stripe.Price.create(
                product=product.id,
                unit_amount=2500,  # $25.00 in cents
                currency="usd",
                recurring={"interval": "month"},
                metadata={"plan_id": pro_plan.id}
            )
            
            # Update database
            pro_plan.stripe_price_id = price.id
            db.commit()
            
            print(f"   ✅ Pro Plan created! Price ID: {price.id}")
        
        print("\n🎉 SUCCESS! All products created in Stripe!\n")
        print("📋 Next steps:")
        print("   1. Set up webhook in Stripe Dashboard")
        print("   2. Add STRIPE_WEBHOOK_SECRET to Replit Secrets")
        print("   3. Test checkout flow with test cards")
        print("\n💳 Test card: 4242 4242 4242 4242 (any future expiry)\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        logger.error("stripe_product_creation_failed", error=str(e))
        return False


if __name__ == "__main__":
    success = create_products()
    sys.exit(0 if success else 1)
