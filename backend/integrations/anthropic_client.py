"""
Anthropic Claude client for AI-powered car search operations.
Provides feature extraction and summary generation.
"""
from typing import List, Dict, Any, Optional
import json

from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger
from core.exceptions import ExternalServiceException

logger = get_logger(__name__)


class ClaudeClient:
    """Async client for Claude API operations."""
    
    def __init__(self):
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True
    )
    async def complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> str:
        """
        Get completion from Claude.
        
        Args:
            messages: Conversation messages
            system_prompt: System instructions
            max_tokens: Max response tokens
        
        Returns:
            Response text
        """
        try:
            # Format messages for Claude API
            formatted = [
                {"role": m["role"], "content": m["content"]}
                for m in messages
                if m.get("role") in ("user", "assistant")
            ]
            
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=max_tokens,
                system=system_prompt or "You are a helpful assistant.",
                messages=formatted
            )
            
            content = response.content[0].text if response.content else ""
            
            logger.info(
                "claude_completion_success",
                input_tokens=response.usage.input_tokens,
                output_tokens=response.usage.output_tokens
            )
            return content
            
        except Exception as e:
            logger.error("claude_completion_error", error=str(e))
            raise ExternalServiceException("Claude", str(e))
    
    async def extract_search_features(self, query: str) -> Dict[str, Any]:
        """
        Extract structured car features from natural language query.
        
        Args:
            query: User's search query
        
        Returns:
            Dict with brand, model, price_max, features, etc.
        """
        system_prompt = """Extract car search parameters from the query.
Return ONLY valid JSON with these optional fields:
- brand: string (manufacturer name)
- model: string (model name)
- type: string (SUV, Sedan, Truck, etc.)
- year_min: number
- year_max: number
- price_min: number
- price_max: number
- features: array of strings (colors, features like AWD, sunroof)
- location: string

Rules:
- "Range Rover" → brand: "Land Rover", model: "Range Rover"
- Colors go in features array: ["red", "leather seats"]
- "under $30k" → price_max: 30000
- Return ONLY JSON, no explanation"""

        messages = [{"role": "user", "content": f"Extract from: {query}"}]
        
        response = await self.complete(messages, system_prompt=system_prompt, max_tokens=256)
        
        try:
            # Clean markdown formatting if present
            cleaned = response.strip()
            if cleaned.startswith("```"):
                parts = cleaned.split("```")
                cleaned = parts[1] if len(parts) > 1 else parts[0]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            
            features = json.loads(cleaned.strip())
            logger.info("features_extracted", query=query[:50], features=features)
            return features
            
        except json.JSONDecodeError as e:
            logger.warning("feature_extraction_failed", error=str(e), response=response[:100])
            return {}
    
    async def generate_search_summary(
        self,
        cars: List[Dict[str, Any]],
        query: str,
        total_count: int
    ) -> str:
        """
        Generate friendly summary of search results.
        
        Args:
            cars: List of car data
            query: Original search query
            total_count: Total cars found
        
        Returns:
            Summary message for user
        """
        if not cars:
            return f"I couldn't find cars matching '{query}'. Try adjusting your search."
        
        system_prompt = """Generate a brief, friendly summary of car search results.
Keep it to 2-3 sentences. Highlight the top car. Be conversational and helpful."""

        # Format top results
        top_cars = []
        for i, car in enumerate(cars[:3]):
            price = car.get("price", 0)
            price_str = f"${price:,}" if price else "Contact dealer"
            top_cars.append(
                f"{i+1}. {car.get('year')} {car.get('brand')} {car.get('model')} - {price_str}"
            )
        
        messages = [{
            "role": "user",
            "content": f"Query: {query}\nFound {total_count} cars:\n" + "\n".join(top_cars)
        }]
        
        try:
            summary = await self.complete(messages, system_prompt=system_prompt, max_tokens=150)
            return summary.strip()
        except Exception as e:
            logger.warning("summary_generation_failed", error=str(e))
            top = cars[0]
            return f"Found {total_count} cars. Top pick: {top.get('year')} {top.get('brand')} {top.get('model')}."


# Convenience alias
AnthropicClient = ClaudeClient
