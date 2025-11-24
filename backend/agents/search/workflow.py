"""
LangGraph workflow assembly for the car search agent.
Connects the 5 steps into a cohesive graph.
"""
from langgraph.graph import StateGraph, END

from agents.search.state import SearchState
from agents.search.steps.analyze_query import analyze_query
from agents.search.steps.scrape_websites import scrape_websites
from agents.search.steps.store_cars import store_cars
from agents.search.steps.find_similar import find_similar
from agents.search.steps.save_history import save_history
from core.logging import get_logger

logger = get_logger(__name__)


def create_search_workflow() -> StateGraph:
    """
    Create the 5-step car search workflow.
    
    Workflow: analyze_query -> scrape_websites -> store_cars -> find_similar -> save_history
    
    Returns:
        Compiled LangGraph workflow
    """
    workflow = StateGraph(SearchState)
    
    workflow.add_node("analyze_query", analyze_query)
    workflow.add_node("scrape_websites", scrape_websites)
    workflow.add_node("store_cars", store_cars)
    workflow.add_node("find_similar", find_similar)
    workflow.add_node("save_history", save_history)
    
    workflow.set_entry_point("analyze_query")
    
    workflow.add_edge("analyze_query", "scrape_websites")
    workflow.add_edge("scrape_websites", "store_cars")
    workflow.add_edge("store_cars", "find_similar")
    workflow.add_edge("find_similar", "save_history")
    workflow.add_edge("save_history", END)
    
    return workflow.compile()


async def run_search(
    query: str,
    user_id: int = None,
    location: str = None,
    postal_code: str = None,
    country: str = None,
) -> SearchState:
    """
    Execute the car search workflow.
    
    Args:
        query: Natural language search query
        user_id: Optional user ID for logged-in users
    
    Returns:
        Final state with matched cars and search results
    """
    logger.info("workflow_start", query=query, user_id=user_id)
    
    workflow = create_search_workflow()
    
    initial_state: SearchState = {"query": query, "user_id": user_id}
    if location:
        initial_state["preferred_location"] = location
    if postal_code:
        initial_state["preferred_postal_code"] = postal_code
    if country:
        initial_state["preferred_country"] = country
    
    final_state = await workflow.ainvoke(initial_state)
    
    logger.info(
        "workflow_complete",
        matched_count=len(final_state.get("matched_cars", [])),
        search_id=final_state.get("search_id")
    )
    
    return final_state
