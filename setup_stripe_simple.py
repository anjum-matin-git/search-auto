#!/usr/bin/env python3
"""
Simple Stripe Product Setup for SearchAuto
Creates Stripe products and displays the price IDs to manually add to database.
"""

import os
import stripe

# Configure Stripe
stripe_key = os.getenv("STRIPE_SECRET_KEY")

if not stripe_key:
    print("❌ ERROR: STRIPE_SECRET_KEY not found!")
    print("\n📝 Add it to Replit Secrets and try again.")
    exit(1)

stripe.api_key = stripe_key

print("\n🚀 Creating Stripe Products for SearchAuto...\n")

try:
    # Create Personal Plan
    print("📦 Creating Personal Plan ($5 for 50 credits)...")
    personal_product = stripe.Product.create(
        name="SearchAuto Personal",
        description="50 car search credits - perfect for occasional searches"
    )
    personal_price = stripe.Price.create(
        product=personal_product.id,
        unit_amount=500,  # $5.00
        currency="usd",
    )
    print(f"   ✅ Personal Plan created!")
    print(f"   Product ID: {personal_product.id}")
    print(f"   Price ID: {personal_price.id}")
    
    # Create Pro Plan
    print("\n📦 Creating Pro Plan ($25/month unlimited)...")
    pro_product = stripe.Product.create(
        name="SearchAuto Pro",
        description="Unlimited car searches every month - for serious car buyers"
    )
    pro_price = stripe.Price.create(
        product=pro_product.id,
        unit_amount=2500,  # $25.00
        currency="usd",
        recurring={"interval": "month"},
    )
    print(f"   ✅ Pro Plan created!")
    print(f"   Product ID: {pro_product.id}")
    print(f"   Price ID: {pro_price.id}")
    
    print("\n\n🎉 SUCCESS! Stripe products created!\n")
    print("=" * 60)
    print("📋 SAVE THESE PRICE IDs:")
    print("=" * 60)
    print(f"\nPersonal Plan Price ID: {personal_price.id}")
    print(f"Pro Plan Price ID: {pro_price.id}")
    print("\n" + "=" * 60)
    print("\n✅ I'll now update your database automatically...")
    
    # Update database using SQL
    import psycopg2
    db_url = os.getenv("DATABASE_URL")
    
    if db_url:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Update Personal plan
        cur.execute(
            "UPDATE plans SET stripe_price_id = %s WHERE name = 'Personal'",
            (personal_price.id,)
        )
        
        # Update Pro plan
        cur.execute(
            "UPDATE plans SET stripe_price_id = %s WHERE name = 'Pro'",
            (pro_price.id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("✅ Database updated with Stripe price IDs!")
    
    print("\n📋 Next steps:")
    print("   1. Set up webhook in Stripe Dashboard")
    print("   2. Add STRIPE_WEBHOOK_SECRET to Replit Secrets")
    print("   3. Test checkout with card: 4242 4242 4242 4242")
    print("\n💳 Your payment system is ready! 🚀\n")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}\n")
    exit(1)
