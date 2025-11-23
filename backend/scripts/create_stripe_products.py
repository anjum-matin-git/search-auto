"""
Create Stripe products and prices for SearchAuto pricing plans.
This will create products in your Stripe account and sync to database.
"""
import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.base import SessionLocal
from db.models import Plan

async def create_stripe_products():
    """Create Stripe products and update plan records."""
    # Import Stripe client
    try:
        from integrations.stripe_client import get_stripe_client
        stripe = await get_stripe_client()
    except:
        print("❌ Stripe client not found. Using environment-based approach...")
        import stripe as stripe_lib
        stripe_lib.api_key = os.getenv("STRIPE_SECRET_KEY")
        stripe = stripe_lib
    
    db = SessionLocal()
    
    try:
        print("🎨 Creating Stripe products and prices...\n")
        
        # Get existing plans from database
        personal_plan = db.query(Plan).filter(Plan.name == "Personal").first()
        pro_plan = db.query(Plan).filter(Plan.name == "Pro").first()
        
        # Create Personal Plan Product
        print("Creating Personal Plan...")
        personal_product = stripe.Product.create(
            name="SearchAuto Personal",
            description="50 AI-powered car searches",
            metadata={
                "plan_type": "personal",
                "credits": "50"
            }
        )
        
        personal_price = stripe.Price.create(
            product=personal_product.id,
            unit_amount=500,  # $5.00 in cents
            currency="usd",
            metadata={
                "plan_name": "Personal"
            }
        )
        
        if personal_plan:
            personal_plan.stripe_price_id = personal_price.id
        
        print(f"✅ Personal Plan created:")
        print(f"   Product ID: {personal_product.id}")
        print(f"   Price ID: {personal_price.id}")
        print(f"   Amount: $5.00")
        
        # Create Pro Plan Product (subscription)
        print("\nCreating Pro Plan...")
        pro_product = stripe.Product.create(
            name="SearchAuto Pro",
            description="Unlimited AI-powered car searches with advanced features",
            metadata={
                "plan_type": "pro",
                "credits": "unlimited"
            }
        )
        
        pro_price = stripe.Price.create(
            product=pro_product.id,
            unit_amount=2500,  # $25.00 in cents
            currency="usd",
            recurring={"interval": "month"},
            metadata={
                "plan_name": "Pro"
            }
        )
        
        if pro_plan:
            pro_plan.stripe_price_id = pro_price.id
        
        print(f"✅ Pro Plan created:")
        print(f"   Product ID: {pro_product.id}")
        print(f"   Price ID: {pro_price.id}")
        print(f"   Amount: $25.00/month")
        
        # Commit changes to database
        db.commit()
        
        print("\n" + "="*50)
        print("✅ All Stripe products created successfully!")
        print("="*50)
        print(f"\n📝 Next steps:")
        print(f"1. Products are now in your Stripe dashboard")
        print(f"2. Use test card: 4242 4242 4242 4242")
        print(f"3. Database plans updated with Stripe price IDs")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating Stripe products: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(create_stripe_products())
