"""
LangGraph ReAct agent for intelligent car search.
Uses Claude for reasoning and tool execution.
"""
from typing import Dict, Any, Optional, List

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from agents.tools import ALL_TOOLS
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# System Prompt
# =============================================================================

AGENT_SYSTEM_PROMPT = """You are SearchAuto's car search assistant. Help users find their perfect car.

TOOLS AVAILABLE:
1. search_car_listings - Search dealer inventory
2. save_search_results - Save results (REQUIRED to show car cards)
3. send_message_to_user - Send message without cars

WORKFLOW (follow exactly):
1. Call search_car_listings with extracted parameters
2. Call save_search_results with results and summary

PARAMETER MAPPING:
- Brand: "Toyota", "BMW", "Mazda"
- Price: "under $30k" → price_max=30000
- Features: colors, types go in required_features
- Pagination: "more" → page=2

EXAMPLES:

"Red Toyota under $30k"
→ search_car_listings(brand="Toyota", price_max=30000, required_features=["red"])
→ save_search_results(user_id=X, results=[...], summary="Found red Toyotas...")

"Show me more"
→ search_car_listings(page=2, ...[previous params])
→ save_search_results(...)

RULES:
- ALWAYS call save_search_results after finding cars
- Keep summaries under 50 words
- If no cars found, use send_message_to_user
- Extract user_id from context"""


# =============================================================================
# Agent Class
# =============================================================================

class CarSearchAgent:
    """
    ReAct agent for autonomous car search.
    
    Responsibilities:
    - Parse user queries
    - Execute search tools
    - Save results to database
    - Handle conversation context
    """
    
    def __init__(self):
        self._llm = ChatAnthropic(
            model=settings.anthropic_model,
            anthropic_api_key=settings.anthropic_api_key,
            max_tokens=1024,
            timeout=float(settings.agent_llm_timeout_seconds),
        )
        
        self._agent = create_react_agent(
            self._llm,
            ALL_TOOLS,
            state_modifier=AGENT_SYSTEM_PROMPT
        )
        
        self._max_iterations = settings.agent_max_iterations
        
        logger.info(
            "agent_initialized",
            model=settings.anthropic_model,
            tools_count=len(ALL_TOOLS),
            max_iterations=self._max_iterations
        )
    
    async def execute_search(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Execute car search with agent.
        
        Args:
            query: User's search query
            user_context: User info (id, location, preferences)
            db: Database session for history
        
        Returns:
            Dict with response, query, tool_calls, messages
        """
        user_id = user_context.get("user_id") if user_context else None
        logger.info("search_start", query=query[:100], user_id=user_id)
        
        try:
            messages: List[BaseMessage] = []
            
            # Load conversation history for context
            if db and user_id:
                history = self._load_conversation_history(db, user_id)
                if history:
                    # Rewrite query if it's a follow-up
                    query = self._rewrite_followup_query(history, query)
                    messages.extend(history[-4:])
                    logger.info("history_loaded", count=len(history))
            
            # Build user message with context
            user_message = self._build_message(query, user_context)
            messages.append(user_message)
            
            # Execute agent
            result = await self._agent.ainvoke(
                {"messages": messages},
                config={"recursion_limit": self._max_iterations}
            )
            
            # Extract response
            response_messages = result.get("messages", [])
            final_message = response_messages[-1] if response_messages else None
            response_text = final_message.content if final_message else "Search completed."
            
            tool_call_count = sum(
                1 for msg in response_messages
                if hasattr(msg, "tool_calls") and msg.tool_calls
            )
            
            logger.info(
                "search_complete",
                tool_calls=tool_call_count,
                response_length=len(response_text)
            )
            
            return {
                "response": response_text,
                "query": query,
                "tool_calls_made": tool_call_count,
                "messages": response_messages
            }
            
        except Exception as e:
            return self._handle_error(e, query)
    
    def _load_conversation_history(
        self,
        db: Session,
        user_id: int
    ) -> List[BaseMessage]:
        """Load recent conversation messages."""
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
    
    def _rewrite_followup_query(
        self,
        history: List[BaseMessage],
        query: str
    ) -> str:
        """Rewrite vague follow-up queries with context."""
        query_lower = query.lower().strip()
        
        followup_keywords = ["more", "next", "another", "again", "different", "else"]
        is_followup = any(kw in query_lower for kw in followup_keywords)
        
        if not is_followup:
            return query
        
        # Find last substantive query
        for msg in reversed(history):
            if isinstance(msg, HumanMessage):
                content = msg.content.lower()
                if not any(kw in content for kw in followup_keywords):
                    if "more" in query_lower:
                        return f"{msg.content} (page 2)"
                    return f"{msg.content} - {query}"
        
        return query
    
    def _build_message(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]]
    ) -> HumanMessage:
        """Build user message with context."""
        parts = [f"Search: {query}"]
        
        if user_context:
            if user_context.get("user_id"):
                parts.append(f"User ID: {user_context['user_id']}")
            if user_context.get("location"):
                parts.append(f"Location: {user_context['location']}")
            if user_context.get("postal_code"):
                parts.append(f"Postal: {user_context['postal_code']}")
            
            prefs = user_context.get("preferences", {})
            if prefs.get("preferred_brands"):
                parts.append(f"Prefers: {', '.join(prefs['preferred_brands'][:2])}")
            if prefs.get("budget"):
                parts.append(f"Budget: ${prefs['budget']}")
        
        parts.append("\nRemember: Call save_search_results after finding cars!")
        
        return HumanMessage(content="\n".join(parts))
    
    def _handle_error(self, error: Exception, query: str) -> Dict[str, Any]:
        """Handle agent errors with user-friendly messages."""
        error_str = str(error).lower()
        error_type = type(error).__name__
        
        logger.error("search_error", query=query[:50], error=str(error), type=error_type)
        
        if "timeout" in error_str:
            message = "Search timed out. Please try a simpler query."
        elif "rate_limit" in error_str:
            message = "High demand. Please try again in a moment."
        elif "credit" in error_str or "balance" in error_str:
            message = "AI service temporarily unavailable."
        else:
            message = "Something went wrong. Please try again."
        
        return {
            "response": message,
            "query": query,
            "tool_calls_made": 0,
            "messages": [],
            "error": str(error)
        }
    
    # Backwards compatibility
    async def search(self, *args, **kwargs):
        return await self.execute_search(*args, **kwargs)


# Global singleton
car_search_agent = CarSearchAgent()
