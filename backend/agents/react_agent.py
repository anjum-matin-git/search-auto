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
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            temperature=0.2,  # Lower temp for more focused responses
            streaming=False
        )
        
        # Create ReAct agent with tools
        self.agent = create_react_agent(
            self.llm,
            ALL_TOOLS,
            state_modifier=self._build_system_prompt()
        )
        
        logger.info("react_agent_initialized", tools=len(ALL_TOOLS))
    
    def _build_system_prompt(self) -> str:
        """Build comprehensive system prompt for the agent."""
        return """You are an expert automotive search assistant powered by SearchAuto.

Your mission: Help users find their perfect car by intelligently using your tools.

AVAILABLE TOOLS:
1. extract_car_features - Parse user queries to understand what they want
2. search_car_listings - Find real cars for sale from Auto.dev API
3. filter_cars_by_criteria - Narrow down results by price, features, brands
4. rank_cars_by_relevance - Sort results by best match

WORKFLOW:
1. First, use extract_car_features to understand the user's query
2. Then, use search_car_listings with the extracted features
3. If needed, use filter_cars_by_criteria to refine results
4. Finally, use rank_cars_by_relevance to sort by best match
5. Present the top 3-5 cars with key details

IMPORTANT RULES:
- Always extract features first before searching
- Search with broad criteria, then filter if needed
- Focus on Canadian locations (country=CA) unless specified otherwise
- If no results, try relaxing criteria (remove year, expand price range)
- Provide specific recommendations with prices, locations, and dealer info
- Be concise but informative - users want quick answers

RESPONSE FORMAT:
When presenting cars, include:
- Brand, Model, Year
- Price (in C$ for Canada)
- Location and dealer
- Key features
- Why it's a good match

Remember: You're helping real people find real cars. Be helpful, accurate, and efficient!"""
    
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
    
    def _build_user_message(
        self,
        query: str,
        user_context: Optional[Dict[str, Any]]
    ) -> HumanMessage:
        """Build context-aware user message."""
        message = f"User query: {query}"
        
        if user_context:
            context_parts = []
            
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

