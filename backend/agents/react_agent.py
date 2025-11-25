"""
World-class ReAct agent using LangGraph's create_react_agent.
Autonomous car search with intelligent tool usage.
"""
from typing import Dict, Any, Optional
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

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
        return """You are an expert automotive search assistant powered by SearchAuto.

Your mission: Help users find their perfect car by intelligently using your tools.

AVAILABLE TOOLS:
1. search_car_listings - Find, filter, and rank cars from Auto.dev API
2. save_search_results - Save your findings and post results to the user's conversation
3. post_message_to_user - Send a message to the user (for clarifications, no results, etc.)

WORKFLOW (MUST FOLLOW EVERY TIME):
1. search_car_listings - Call with all inferred parameters (brand, price, features, etc.)
2. **MANDATORY**: save_search_results - Save top 3-5 cars with your summary

CRITICAL RULES:
- You MUST call save_search_results as your FINAL step when you find cars
- WITHOUT save_search_results, the user will NOT see any car cards on their screen
- If no cars found, use post_message_to_user instead
- Do not ask for clarification unless absolutely necessary. Infer parameters from the query.
- Pass 'required_features' to search_car_listings for any features mentioned (e.g., "red", "sunroof", "AWD")
- Pass 'user_query' to search_car_listings to enable intelligent ranking

EXAMPLE WORKFLOW:
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

Remember: save_search_results is NOT optional - it's REQUIRED to show cars to the user!"""
    
    async def search(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute autonomous car search.
        
        Args:
            query: User's natural language query
            user_context: Optional context (location, preferences, etc.)
            
        Returns:
            Search results with agent's analysis
        """
        logger.info("agent_search_start", query=query)
        
        try:
            # Build context-aware message
            user_message = self._build_user_message(query, user_context)
            
            # Run the agent
            result = await self.agent.ainvoke({
                "messages": [user_message]
            })
            
            # Extract final response
            messages = result.get("messages", [])
            final_message = messages[-1] if messages else None
            
            response_text = final_message.content if final_message else "No results found"
            
            # Count tool calls
            tool_calls = sum(
                1 for msg in messages 
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
                "messages": messages
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

