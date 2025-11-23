"""
Stripe client for SearchAuto.
Handles Stripe API interactions for checkout and subscriptions.
"""
import os
import stripe
from typing import Optional
from core.logging import get_logger

logger = get_logger(__name__)

# Initialize Stripe with API key from environment
stripe.api_key = os.getenv("STRIPE_SECRET_KEY") or os.getenv("STRIPE_API_KEY")

async def get_stripe_client():
    """Get configured Stripe client."""
    if not stripe.api_key:
        raise ValueError("Stripe API key not configured. Set STRIPE_SECRET_KEY environment variable.")
    return stripe


async def create_checkout_session(
    price_id: str,
    customer_email: str,
    success_url: str,
    cancel_url: str,
    customer_id: Optional[str] = None,
    mode: str = "payment"
) -> stripe.checkout.Session:
    """
    Create a Stripe checkout session.
    
    Args:
        price_id: Stripe price ID
        customer_email: Customer email
        success_url: URL to redirect on success
        cancel_url: URL to redirect on cancel
        customer_id: Existing Stripe customer ID (optional)
        mode: 'payment' for one-time, 'subscription' for recurring
    """
    logger.info(
        "creating_checkout_session",
        price_id=price_id,
        mode=mode,
        customer_id=customer_id
    )
    
    session_params = {
        "payment_method_types": ["card"],
        "line_items": [{
            "price": price_id,
            "quantity": 1,
        }],
        "mode": mode,
        "success_url": success_url,
        "cancel_url": cancel_url,
    }
    
    # Add customer if exists, otherwise use email
    if customer_id:
        session_params["customer"] = customer_id
    else:
        session_params["customer_email"] = customer_email
    
    session = stripe.checkout.Session.create(**session_params)
    
    logger.info(
        "checkout_session_created",
        session_id=session.id,
        url=session.url
    )
    
    return session


async def create_customer(email: str, user_id: int) -> stripe.Customer:
    """Create a Stripe customer."""
    logger.info("creating_stripe_customer", email=email, user_id=user_id)
    
    customer = stripe.Customer.create(
        email=email,
        metadata={"user_id": str(user_id)}
    )
    
    logger.info("stripe_customer_created", customer_id=customer.id)
    return customer


async def get_publishable_key() -> str:
    """Get Stripe publishable key for frontend."""
    pub_key = os.getenv("STRIPE_PUBLISHABLE_KEY") or os.getenv("STRIPE_PUBLIC_KEY")
    if not pub_key:
        raise ValueError("Stripe publishable key not configured")
    return pub_key
