"""
World-class ReAct agent using LangGraph's create_react_agent.
Autonomous car search with intelligent tool usage.
"""
from typing import Dict, Any, Optional, List
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from sqlalchemy.orm import Session

from agents.tools import ALL_TOOLS
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class CarSearchAgent:
    """
    Autonomous ReAct agent for car search.
    Uses LangGraph's built-in create_react_agent for optimal performance.
    """
    
    def __init__(self):
        # Initialize LLM
        # Note: Some models (like o1-preview) only support temperature=1
        # Explicitly set to 1 for compatibility with all models
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=1,  # Required for models like o1-preview
            streaming=False
        )
        
        # Create ReAct agent with tools
        self.agent = create_react_agent(
            self.llm,
            ALL_TOOLS,
            state_modifier=self._build_system_prompt()
        )
        
        logger.info(
            "react_agent_initialized",
            model=settings.openai_model,
            tools=len(ALL_TOOLS)
        )
    
    def _build_system_prompt(self) -> str:
        """Build comprehensive system prompt for the agent."""
        return """You are SearchAuto's expert automotive concierge. Your goal is to help users find their dream car with precision, speed, and helpfulness.

CAPABILITIES:
- You can search real dealer inventory across the US and Canada.
- You can filter by price, brand, model, year, features (e.g., "sunroof", "AWD", "leather"), and location.
- You can rank results by relevance to the user's specific query.
- You can handle pagination (showing more results) if the user asks.

AVAILABLE TOOLS:
1. search_car_listings - Find, filter, and rank cars. Supports pagination (limit, page).
2. save_search_results - Save your findings and post results to the user's conversation.
3. post_message_to_user - Send a message to the user (for clarifications, no results, etc.).

WORKFLOW (MUST FOLLOW EVERY TIME):
1. search_car_listings - Call with all inferred parameters.
   - If user asks for "more", increment the `page` parameter.
   - If specific features are mentioned (e.g. "red", "electric"), pass them in `required_features`.
   - Always pass `user_query` for intelligent ranking.
2. **MANDATORY**: save_search_results - Save the cars you found.
   - Provide a helpful, engaging summary in the `summary` field. Mention key highlights of the top car.

CRITICAL RULES:
- You MUST call save_search_results as your FINAL step when you find cars.
- WITHOUT save_search_results, the user will NOT see any car cards.
- If no cars found, use post_message_to_user to inform the user and suggest alternatives.
- Be proactive: if a user searches for "cheap cars", infer a reasonable price cap (e.g., $15k-$20k) if not specified.
- If the user asks for "more", use `page=2` in `search_car_listings`.

EXAMPLE WORKFLOW (New Search):
User: "Electric SUV under $60k"
1. search_car_listings(
     price_max=60000, 
     required_features=["electric", "SUV"], 
     user_query="Electric SUV under $60k"
   )
2. save_search_results(
     user_id=123,
     query="Electric SUV under $60k",
     results=[...],
     summary="I found 3 great electric SUVs under $60k..."
   )

EXAMPLE WORKFLOW (Pagination):
User: "Show me more"
1. search_car_listings(
     price_max=60000, 
     required_features=["electric", "SUV"], 
     user_query="Electric SUV under $60k",
     page=2
   )
2. save_search_results(...)

Remember: You are a helpful assistant. Be concise but informative."""
    
    async def search(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Execute autonomous car search.
        
        Args:
            query: User's natural language query
            user_context: Optional context (location, preferences, etc.)
            db: Optional database session for history retrieval
            
        Returns:
            Search results with agent's analysis
        """
        logger.info("agent_search_start", query=query)
        
        try:
            messages = []
            
            # 1. Fetch history if available
            if db and user_context and user_context.get("user_id"):
                user_id = user_context["user_id"]
                history = self._fetch_conversation_history(db, user_id)
                if history:
                    messages.extend(history)
                    logger.info("history_loaded", messages_count=len(history))
            
            # 2. Build current user message
            user_message = self._build_user_message(query, user_context)
            messages.append(user_message)
            
            # 3. Run the agent
            result = await self.agent.ainvoke({
                "messages": messages
            })
            
            # Extract final response
            response_messages = result.get("messages", [])
            final_message = response_messages[-1] if response_messages else None
            
            response_text = final_message.content if final_message else "No results found"
            
            # Count tool calls
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
            logger.error(
                "agent_search_error",
                query=query,
                error=str(e),
                error_type=type(e).__name__
            )
            
            # Return a user-friendly error response
            error_message = "I apologize, but I encountered an error while searching for cars. "
            
            # Provide specific error messages for common issues
            if "rate_limit" in str(e).lower():
                error_message += "The AI service is currently rate limited. Please try again in a moment."
            elif "api_key" in str(e).lower() or "authentication" in str(e).lower():
                error_message += "There's an authentication issue with the AI service. Please contact support."
            elif "timeout" in str(e).lower():
                error_message += "The request timed out. Please try again."
            else:
                error_message += "Please try again or contact support if the issue persists."
            
            return {
                "response": error_message,
                "query": query,
                "tool_calls_made": 0,
                "messages": [],
                "error": str(e)
            }
    
    def _fetch_conversation_history(self, db: Session, user_id: int) -> List[Any]:
        """Fetch recent conversation history for context."""
        try:
            from db.repositories import ConversationRepository
            repo = ConversationRepository(db)
            
            # Get/Create conversation to ensure we have the ID
            conversation = repo.get_or_create(user_id)
            
            # Fetch last 10 messages
            messages = repo.list_messages(conversation.id, limit=10)
            
            history = []
            for msg in messages:
                if msg.role == "user":
                    history.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    history.append(AIMessage(content=msg.content))
            
            return history
        except Exception as e:
            logger.warning("failed_to_load_history", error=str(e), user_id=user_id)
            return []

    def _build_user_message(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]]
    ) -> HumanMessage:
        """Build context-aware user message."""
        message = f"User query: {query}"
        
        if user_context:
            context_parts = []
            
            # Add user_id for tools to use
            if user_context.get("user_id"):
                context_parts.append(f"User ID: {user_context['user_id']} (use this when calling save_search_results or post_message_to_user)")
            
            if user_context.get("location"):
                context_parts.append(f"Location: {user_context['location']}")
            
            if user_context.get("postal_code"):
                context_parts.append(f"Postal Code: {user_context['postal_code']}")
            
            if user_context.get("preferences"):
                prefs = user_context["preferences"]
                if prefs.get("preferred_brands"):
                    context_parts.append(f"Preferred Brands: {', '.join(prefs['preferred_brands'])}")
                if prefs.get("preferred_types"):
                    context_parts.append(f"Preferred Types: {', '.join(prefs['preferred_types'])}")
                if prefs.get("budget"):
                    context_parts.append(f"Budget: ${prefs['budget']}")
            
            if context_parts:
                message += f"\n\nUser Context:\n" + "\n".join(f"- {p}" for p in context_parts)
        
        return HumanMessage(content=message)


# Global agent instance
car_search_agent = CarSearchAgent()
