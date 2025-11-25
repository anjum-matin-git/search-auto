"""
Robust car search agent using Claude.
Deterministic workflow with proper error handling.
"""
from typing import Dict, Any, Optional, List
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from agents.tools import ALL_TOOLS
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class CarSearchAgent:
    """
    Robust car search agent using Claude.
    Workflow: Search -> Save -> Done.
    """
    
    def __init__(self):
        # Initialize Claude LLM
        self.llm = ChatAnthropic(
            model=settings.anthropic_model,
            anthropic_api_key=settings.anthropic_api_key,
            max_tokens=1024,
            timeout=30.0,
        )
        
        # Create ReAct agent
        self.agent = create_react_agent(
            self.llm,
            ALL_TOOLS,
            state_modifier=self._build_system_prompt()
        )
        
        # Allow enough iterations for: search + save + response
        self.max_iterations = 10
        
        logger.info(
            "react_agent_initialized",
            model=settings.anthropic_model,
            tools=len(ALL_TOOLS)
        )
    
    def _build_system_prompt(self) -> str:
        """Build action-oriented system prompt."""
        return """You are SearchAuto's car search assistant. Your job is to find cars and save results.

AVAILABLE TOOLS:
1. search_car_listings - Find cars from dealer inventory
2. save_search_results - REQUIRED: Save results so user sees car cards
3. post_message_to_user - Send message without car results

CRITICAL WORKFLOW - YOU MUST COMPLETE BOTH STEPS:

Step 1: Call search_car_listings with parameters from user query
Step 2: Call save_search_results with the results (THIS IS MANDATORY)

If you skip save_search_results, the user will NOT see any cars!

PARAMETER EXTRACTION:
- Brand: "Toyota", "BMW", "Mazda" etc
- Price: "under $30k" = price_max=30000
- Features: colors ("red", "blue"), types ("SUV", "sedan"), features ("AWD", "sunroof")
- Pagination: "more" or "next" = page=2

EXAMPLES:

Query: "Red Toyota under $30k"
→ search_car_listings(brand="Toyota", price_max=30000, required_features=["red"], user_query="Red Toyota under $30k")
→ save_search_results(user_id=X, query="Red Toyota under $30k", results=[...], summary="Found X red Toyotas...")

Query: "Show me more"
→ search_car_listings(page=2, ...[same params as before])
→ save_search_results(...)

Query: "BMW or Audi"
→ search_car_listings(brand="BMW", limit=5)
→ search_car_listings(brand="Audi", limit=5)
→ save_search_results(...combined results...)

RULES:
- ALWAYS call save_search_results after finding cars
- Keep summary under 50 words
- If no cars found, use post_message_to_user to explain
- Extract user_id from the context provided"""
    
    async def search(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """Execute car search."""
        user_id = user_context.get("user_id") if user_context else None
        logger.info("agent_search_start", query=query, user_id=user_id)
        
        try:
            messages = []
            
            # Load history for context
            if db and user_id:
                history = self._fetch_conversation_history(db, user_id)
                if history:
                    query = await self._contextualize_query(history, query)
                    messages.extend(history[-4:])
                    logger.info("history_loaded", messages_count=len(history))
            
            # Build user message
            user_message = self._build_user_message(query, user_context)
            messages.append(user_message)
            
            # Run agent
            result = await self.agent.ainvoke(
                {"messages": messages},
                config={"recursion_limit": self.max_iterations}
            )
            
            # Extract response
            response_messages = result.get("messages", [])
            final_message = response_messages[-1] if response_messages else None
            response_text = final_message.content if final_message else "Search completed."
            
            tool_calls = sum(
                1 for msg in response_messages 
                if hasattr(msg, "tool_calls") and msg.tool_calls
            )
            
            logger.info(
                "agent_search_complete",
                tool_calls=tool_calls,
                response_length=len(response_text)
            )
            
            return {
                "response": response_text,
                "query": query,
                "tool_calls_made": tool_calls,
                "messages": response_messages
            }
            
        except Exception as e:
            error_type = type(e).__name__
            logger.error("agent_search_error", query=query, error=str(e), error_type=error_type)
            
            if "timeout" in str(e).lower():
                error_msg = "Search timed out. Please try a simpler query."
            elif "rate_limit" in str(e).lower():
                error_msg = "High demand. Please try again in a moment."
            elif "credit" in str(e).lower() or "balance" in str(e).lower():
                error_msg = "AI service temporarily unavailable. Please try again."
            else:
                error_msg = "Something went wrong. Please try again."
            
            return {
                "response": error_msg,
                "query": query,
                "tool_calls_made": 0,
                "messages": [],
                "error": str(e)
            }
    
    async def _contextualize_query(self, history: List[Any], query: str) -> str:
        """Rewrite vague follow-up queries."""
        query_lower = query.lower().strip()
        
        follow_ups = ["more", "next", "another", "again", "different", "else", "other"]
        if not any(p in query_lower for p in follow_ups):
            return query
        
        # Find last real search
        for msg in reversed(history):
            if isinstance(msg, HumanMessage):
                content = msg.content.lower()
                if not any(p in content for p in follow_ups):
                    if "more" in query_lower:
                        return f"{msg.content} (page 2)"
                    return f"{msg.content} - {query}"
                    break
        
        return query
    
    def _fetch_conversation_history(self, db: Session, user_id: int) -> List[Any]:
        """Fetch recent conversation."""
        try:
            from db.repositories import ConversationRepository
            repo = ConversationRepository(db)
            conversation = repo.get_or_create(user_id)
            messages = repo.list_messages(conversation.id, limit=6)
            
            history = []
            for msg in messages:
                if msg.role == "user":
                    history.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    history.append(AIMessage(content=msg.content))
            
            return history
        except Exception as e:
            logger.warning("history_load_failed", error=str(e), user_id=user_id)
            return []
    
    def _build_user_message(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]]
    ) -> HumanMessage:
        """Build user message with context."""
        parts = [f"Search request: {query}"]
        
        if user_context:
            if user_context.get("user_id"):
                parts.append(f"User ID: {user_context['user_id']} (use this for save_search_results)")
            if user_context.get("location"):
                parts.append(f"Location: {user_context['location']}")
            if user_context.get("postal_code"):
                parts.append(f"Postal: {user_context['postal_code']}")
            
            prefs = user_context.get("preferences", {})
            if prefs.get("preferred_brands"):
                parts.append(f"Preferred brands: {', '.join(prefs['preferred_brands'][:2])}")
            if prefs.get("budget"):
                parts.append(f"Budget: ${prefs['budget']}")
        
        parts.append("\nRemember: You MUST call save_search_results after finding cars!")
        
        return HumanMessage(content="\n".join(parts))


# Global agent instance
car_search_agent = CarSearchAgent()
