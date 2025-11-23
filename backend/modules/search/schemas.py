"""
Pydantic schemas for search requests and responses.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Request schema for car search."""
    query: str = Field(..., min_length=1)
    user_id: Optional[int] = None


class SpecsResponse(BaseModel):
    """Specs sub-schema for a car."""
    acceleration: Optional[str] = None
    topSpeed: Optional[str] = None
    power: Optional[str] = None
    mpg: Optional[str] = None


class CarResponse(BaseModel):
    """Response schema for a single car."""
    id: int
    brand: str
    model: str
    year: int
    price: str  # Formatted as "$50,000"
    priceNumeric: Optional[int] = None
    mileage: Optional[str] = None  # Formatted as "15,000 mi"
    mileageNumeric: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    source: Optional[str] = None
    sourceUrl: Optional[str] = None
    description: Optional[str] = None
    features: List[str] = []
    images: List[str] = []
    specs: Optional[SpecsResponse] = None
    match: Optional[int] = None  # Percentage 0-100
    vin: Optional[str] = None
    dealerName: Optional[str] = None
    dealerPhone: Optional[str] = None
    dealerAddress: Optional[str] = None


class SearchResponse(BaseModel):
    """Response schema for search results."""
    success: bool = True
    query: str
    count: int
    results: List[CarResponse]
    search_id: Optional[int] = None
