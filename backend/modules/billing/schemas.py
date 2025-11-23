"""
Pydantic schemas for billing and payments.
"""
from typing import Optional, List
from pydantic import BaseModel


class PlanResponse(BaseModel):
    id: int
    name: str
    price: float
    credits: Optional[int]
    features: dict
    stripe_price_id: Optional[str]
    
    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    plan_id: int


class CheckoutResponse(BaseModel):
    checkout_url: str


class CreditsResponse(BaseModel):
    credits_remaining: int
    unlimited: bool
    has_subscription: bool
    plan_name: Optional[str]


class ContactSalesRequest(BaseModel):
    name: str
    email: str
    company: Optional[str]
    message: str
