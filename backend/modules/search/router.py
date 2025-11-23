"""
FastAPI router for search endpoints.
"""
from fastapi import APIRouter

from modules.search.schemas import SearchRequest, SearchResponse, CarResponse
from agents.search.workflow import run_search

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search_cars(request: SearchRequest):
    """
    Search for cars using natural language query.
    Runs the 5-step LangGraph workflow.
    """
    final_state = await run_search(
        query=request.query,
        user_id=request.user_id
    )
    
    matched_cars_with_scores = [
        CarResponse(**car, match_score=score)
        for car, score in zip(
            final_state.get("matched_cars", []),
            final_state.get("match_scores", [])
        )
    ]
    
    return SearchResponse(
        query=request.query,
        matched_cars=matched_cars_with_scores,
        search_id=final_state.get("search_id"),
        total_results=len(matched_cars_with_scores)
    )
