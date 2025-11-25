"""
Anthropic Claude integration for AI-powered car search.
Clean, typed interface with error handling and retries.
"""
from typing import List, Dict, Any, Optional
import json

from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger
from core.exceptions import ExternalServiceException

logger = get_logger(__name__)


class AnthropicClient:
    """Client for Anthropic Claude API operations (async)."""
    
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True
    )
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> str:
        """
        Get chat completion from Claude.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            system: Optional system prompt
            max_tokens: Maximum tokens in response
        
        Returns:
            Response content as string
        """
        try:
            logger.info("anthropic_chat_request", model=self.model, messages_count=len(messages))
            
            # Convert messages format if needed
            formatted_messages = []
            for msg in messages:
                role = msg.get("role", "user")
                # Claude only accepts "user" and "assistant" roles
                if role == "system":
                    continue  # System is passed separately
                formatted_messages.append({
                    "role": role if role in ["user", "assistant"] else "user",
                    "content": msg.get("content", "")
                })
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system or "You are a helpful assistant.",
                messages=formatted_messages
            )
            
            content = response.content[0].text if response.content else ""
            
            logger.info("anthropic_chat_success", 
                       input_tokens=response.usage.input_tokens,
                       output_tokens=response.usage.output_tokens)
            return content
            
        except Exception as e:
            logger.error("anthropic_chat_error", error=str(e))
            raise ExternalServiceException("Anthropic", str(e))
    
    async def extract_features(self, query: str) -> Dict[str, Any]:
        """
        Extract car features from natural language query using Claude.
        
        Args:
            query: User's natural language search query
        
        Returns:
            Dict with extracted features (brand, model, type, price_range, etc.)
        """
        system = """You are a car search feature extractor. Extract structured car features from user queries.
Return ONLY valid JSON with these fields (all optional):
- brand: string (e.g., "Toyota", "BMW", "Land Rover")
- model: string (e.g., "Camry", "3 Series", "Range Rover")
- type: string (e.g., "SUV", "Sedan", "Truck")
- year_min: number
- year_max: number
- price_min: number
- price_max: number
- mileage_max: number
- features: array of strings (e.g., ["leather seats", "sunroof", "red", "AWD"])
- location: string

IMPORTANT: 
- "Range Rover" is a model by brand "Land Rover"
- Colors like "red", "blue", "black" go in features array
- Only include fields mentioned in the query
- Return ONLY the JSON object, no explanation"""

        messages = [{"role": "user", "content": f"Extract car features from: {query}"}]
        
        response = await self.chat_completion(messages, system=system, max_tokens=512)
        
        try:
            # Clean up response - remove markdown if present
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            cleaned = cleaned.strip()
            
            features = json.loads(cleaned)
            logger.info("features_extracted", query=query, features=features)
            return features
        except json.JSONDecodeError as e:
            logger.error("json_decode_error", response=response, error=str(e))
            return {}
    
    async def generate_summary(
        self,
        cars: List[Dict[str, Any]],
        query: str,
        count: int
    ) -> str:
        """
        Generate a helpful summary of search results.
        
        Args:
            cars: List of car data
            query: Original user query
            count: Total number of cars found
        
        Returns:
            Friendly summary string
        """
        if not cars:
            return f"I couldn't find any cars matching '{query}'. Try broadening your search criteria."
        
        system = """You are a helpful car concierge. Generate a brief, friendly summary of search results.
Keep it to 2-3 sentences. Mention the top car's key highlights. Be conversational."""

        # Prepare car summaries
        car_summaries = []
        for i, car in enumerate(cars[:3]):
            car_summaries.append(
                f"{i+1}. {car.get('year', 'N/A')} {car.get('brand', '')} {car.get('model', '')} "
                f"- ${car.get('price', 'N/A'):,} in {car.get('location', 'N/A')}"
            )
        
        messages = [{
            "role": "user",
            "content": f"Query: {query}\nFound {count} cars. Top results:\n" + "\n".join(car_summaries)
        }]
        
        try:
            summary = await self.chat_completion(messages, system=system, max_tokens=256)
            return summary.strip()
        except Exception as e:
            logger.warning("summary_generation_failed", error=str(e))
            # Fallback to simple summary
            top = cars[0]
            return f"Found {count} cars matching your search. Top pick: {top.get('year')} {top.get('brand')} {top.get('model')} at ${top.get('price', 0):,}."

