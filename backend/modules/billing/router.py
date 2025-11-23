"""
Billing and payment API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import Plan, User, UserSubscription
from services.credits_service import CreditsService
from core.auth import get_current_user
from .schemas import (
    PlanResponse,
    CheckoutRequest, 
    CheckoutResponse,
    CreditsResponse,
    ContactSalesRequest
)
from core.logging import get_logger
import os

logger = get_logger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans", response_model=List[PlanResponse])
async def list_plans(db: Session = Depends(get_db)):
    """Get all available pricing plans."""
    plans = db.query(Plan).filter(Plan.active == True).all()
    return plans


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe checkout session for a plan."""
    from integrations.stripe_client import create_checkout_session, create_customer
    
    plan = db.query(Plan).filter(Plan.id == request.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.name == "Premium":
        raise HTTPException(
            status_code=400,
            detail="Premium plan requires contacting sales. Please use the contact form."
        )
    
    if not plan.stripe_price_id:
        raise HTTPException(
            status_code=400,
            detail=f"Plan '{plan.name}' is not configured for online purchase. Please contact support."
        )
    
    # Create or get Stripe customer
    stripe_customer_id = current_user.stripe_customer_id
    if not stripe_customer_id:
        customer = await create_customer(current_user.email, current_user.id)
        stripe_customer_id = customer.id
        
        # Update user with Stripe customer ID
        from sqlalchemy import update
        db.execute(
            update(User).where(User.id == current_user.id).values(stripe_customer_id=stripe_customer_id)
        )
        db.commit()
    
    # Determine checkout mode (payment for one-time, subscription for recurring)
    mode = "subscription" if plan.name == "Pro" else "payment"
    
    # Create checkout session
    success_url = f"{os.getenv('APP_URL', 'http://localhost:5000')}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{os.getenv('APP_URL', 'http://localhost:5000')}/pricing"
    
    session = await create_checkout_session(
        price_id=plan.stripe_price_id,
        customer_email=current_user.email,
        success_url=success_url,
        cancel_url=cancel_url,
        customer_id=stripe_customer_id,
        mode=mode
    )
    
    logger.info(
        "checkout_session_created",
        user_id=current_user.id,
        plan_id=plan.id,
        plan_name=plan.name,
        session_id=session.id
    )
    
    return CheckoutResponse(checkout_url=session.url)


@router.get("/credits", response_model=CreditsResponse)
async def get_credits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authenticated user's current credit balance and subscription status."""
    credits_service = CreditsService(db)
    credits_info = credits_service.get_user_credits(current_user.id)
    
    if not credits_info:
        raise HTTPException(status_code=404, detail="User not found")
    
    return credits_info


@router.post("/contact-sales")
async def contact_sales(
    request: ContactSalesRequest,
    db: Session = Depends(get_db)
):
    """
    Submit Premium plan inquiry.
    Stores lead information for sales team follow-up.
    """
    logger.info(
        "premium_inquiry",
        name=request.name,
        email=request.email,
        company=request.company
    )
    
    # TODO: Store in database and/or send notification to sales team
    
    return {
        "message": "Thank you! Our team will contact you within 24 hours.",
        "success": True
    }
