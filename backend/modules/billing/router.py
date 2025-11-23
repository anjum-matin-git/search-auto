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
    db: Session = Depends(get_db)
):
    """
    Create Stripe checkout session for a plan.
    For now, returns placeholder - will integrate with Stripe.
    """
    plan = db.query(Plan).filter(Plan.id == request.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.name == "Premium":
        raise HTTPException(
            status_code=400,
            detail="Premium plan requires contacting sales"
        )
    
    # TODO: Integrate with Stripe checkout
    # For now, return placeholder
    logger.info("checkout_requested", plan_id=plan.id, plan_name=plan.name)
    
    return CheckoutResponse(
        checkout_url=f"/checkout/processing?plan={plan.id}"
    )


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
