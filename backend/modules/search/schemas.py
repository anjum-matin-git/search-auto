"""
Pydantic schemas for search requests and responses.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Request schema for car search."""
    query: str = Field(..., min_length=1)
    user_id: Optional[int] = None


class CarResponse(BaseModel):
    """Response schema for a single car."""
    id: int
    brand: str
    model: str
    year: int
    price: Optional[int] = None
    mileage: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    features: List[str] = []
    images: List[str] = []
    acceleration: Optional[float] = None
    top_speed: Optional[float] = None
    power: Optional[float] = None
    mpg: Optional[float] = None
    match_score: Optional[float] = None


class SearchResponse(BaseModel):
    """Response schema for search results."""
    success: bool = True
    query: str
    count: int
    results: List[CarResponse]
    search_id: Optional[int] = None
