"""
Stripe webhook handlers for payment fulfillment.
Automatically grants credits and activates subscriptions when payments succeed.
"""
import os
import stripe
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session

from db.models import User, Plan, UserSubscription
from services.credits_service import CreditsService
from core.logging import get_logger

logger = get_logger(__name__)

# Stripe webhook secret for signature verification
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")


async def verify_webhook_signature(payload: bytes, signature: str) -> stripe.Event:
    """
    Verify Stripe webhook signature and parse event.
    Prevents replay attacks and ensures webhook authenticity.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_WEBHOOK_SECRET
        )
        return event
    except ValueError:
        logger.error("invalid_webhook_payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("invalid_webhook_signature")
        raise HTTPException(status_code=400, detail="Invalid signature")


async def handle_payment_success(session: stripe.checkout.Session, db: Session):
    """
    Handle successful one-time payment (Personal plan).
    Grants credits to the user.
    """
    customer_id = session.customer
    
    # Get user by Stripe customer ID
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.error("user_not_found_for_customer", customer_id=customer_id)
        return
    
    # Get plan from metadata or line items
    # For now, assume Personal plan (50 credits for $5)
    credits_to_add = 50
    
    # Add credits to user
    credits_service = CreditsService(db)
    new_balance = credits_service.add_credits(user.id, credits_to_add)
    
    logger.info(
        "payment_success_credits_granted",
        user_id=user.id,
        credits_added=credits_to_add,
        new_balance=new_balance,
        session_id=session.id
    )


async def handle_subscription_created(subscription: stripe.Subscription, db: Session):
    """
    Handle new subscription creation (Pro plan).
    Activates unlimited searches for the user.
    """
    customer_id = subscription.customer
    
    # Get user by Stripe customer ID
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        logger.error("user_not_found_for_customer", customer_id=customer_id)
        return
    
    # Get Pro plan
    pro_plan = db.query(Plan).filter(Plan.name == "Pro").first()
    if not pro_plan:
        logger.error("pro_plan_not_found")
        return
    
    # Create or update subscription record
    user_subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id
    ).first()
    
    if user_subscription:
        user_subscription.plan_id = pro_plan.id
        user_subscription.stripe_subscription_id = subscription.id
        user_subscription.status = subscription.status
    else:
        user_subscription = UserSubscription(
            user_id=user.id,
            plan_id=pro_plan.id,
            stripe_subscription_id=subscription.id,
            status=subscription.status
        )
        db.add(user_subscription)
    
    # Grant unlimited searches
    credits_service = CreditsService(db)
    credits_service.set_unlimited(user.id, unlimited=True)
    
    db.commit()
    
    logger.info(
        "subscription_created_unlimited_granted",
        user_id=user.id,
        subscription_id=subscription.id,
        plan=pro_plan.name
    )


async def handle_subscription_updated(subscription: stripe.Subscription, db: Session):
    """Handle subscription updates (status changes, plan changes)."""
    customer_id = subscription.customer
    
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return
    
    user_subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id
    ).first()
    
    if user_subscription:
        user_subscription.status = subscription.status
        user_subscription.stripe_subscription_id = subscription.id
        
        # If subscription is canceled or past_due, revoke unlimited
        if subscription.status in ["canceled", "past_due", "unpaid"]:
            credits_service = CreditsService(db)
            credits_service.set_unlimited(user.id, unlimited=False)
            logger.info("subscription_revoked", user_id=user.id, status=subscription.status)
        
        db.commit()
        
        logger.info(
            "subscription_updated",
            user_id=user.id,
            subscription_id=subscription.id,
            status=subscription.status
        )


async def handle_subscription_deleted(subscription: stripe.Subscription, db: Session):
    """Handle subscription cancellation."""
    customer_id = subscription.customer
    
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return
    
    # Revoke unlimited searches
    credits_service = CreditsService(db)
    credits_service.set_unlimited(user.id, unlimited=False)
    
    # Update subscription status
    user_subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id
    ).first()
    
    if user_subscription:
        user_subscription.status = "canceled"
        db.commit()
    
    logger.info(
        "subscription_deleted_unlimited_revoked",
        user_id=user.id,
        subscription_id=subscription.id
    )


async def process_webhook(request: Request, db: Session):
    """
    Process incoming Stripe webhook events.
    Handles payment success and subscription lifecycle events.
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    # Verify signature and parse event
    event = await verify_webhook_signature(payload, signature)
    
    logger.info("webhook_received", event_type=event.type, event_id=event.id)
    
    # Handle different event types
    try:
        if event.type == "checkout.session.completed":
            session = event.data.object
            if session.mode == "payment":
                await handle_payment_success(session, db)
        
        elif event.type == "customer.subscription.created":
            subscription = event.data.object
            await handle_subscription_created(subscription, db)
        
        elif event.type == "customer.subscription.updated":
            subscription = event.data.object
            await handle_subscription_updated(subscription, db)
        
        elif event.type == "customer.subscription.deleted":
            subscription = event.data.object
            await handle_subscription_deleted(subscription, db)
        
        else:
            logger.info("webhook_event_ignored", event_type=event.type)
    
    except Exception as e:
        logger.error(
            "webhook_processing_error",
            event_type=event.type,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Webhook processing failed")
    
    return {"status": "success"}
