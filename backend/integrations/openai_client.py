"""
OpenAI integration for GPT-5 chat and text embeddings.
Clean, typed interface with error handling.
"""
from typing import List, Dict, Any
import json
import asyncio

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.logging import get_logger
from core.exceptions import ExternalServiceException

logger = get_logger(__name__)


class OpenAIClient:
    """Client for OpenAI API operations (async)."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.embedding_model = settings.openai_embedding_model
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        response_format: str = "text",
        temperature: float = 0.7,
    ) -> str:
        """
        Get chat completion from GPT model.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            response_format: 'text' or 'json_object'
            temperature: Sampling temperature (0-2)
        
        Returns:
            Response content as string
        """
        try:
            logger.info("openai_chat_request", model=self.model, messages_count=len(messages))
            
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
            }
            
            if response_format == "json_object":
                kwargs["response_format"] = {"type": "json_object"}
            
            response = await self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            
            logger.info("openai_chat_success", tokens_used=response.usage.total_tokens)
            return content
            
        except Exception as e:
            logger.error("openai_chat_error", error=str(e))
            raise ExternalServiceException("OpenAI", str(e))
    
    async def extract_features(self, query: str) -> Dict[str, Any]:
        """
        Extract car features from natural language query using GPT.
        
        Args:
            query: User's natural language search query
        
        Returns:
            Dict with extracted features (brand, model, type, price_range, etc.)
        """
        messages = [
            {
                "role": "system",
                "content": """You are a car search assistant. Extract structured car features from user queries.
Return JSON with these fields (all optional):
- brand: string (e.g., "Toyota", "BMW")
- model: string (e.g., "Camry", "3 Series")
- type: string (e.g., "SUV", "Sedan", "Truck")
- year_min: number
- year_max: number
- price_min: number
- price_max: number
- mileage_max: number
- features: array of strings (e.g., ["leather seats", "sunroof"])
- location: string

Only include fields mentioned in the query. Be flexible with synonyms."""
            },
            {
                "role": "user",
                "content": f"Extract car features from: {query}"
            }
        ]
        
        response = await self.chat_completion(messages, response_format="json_object")
        
        try:
            features = json.loads(response)
            logger.info("features_extracted", query=query, features=features)
            return features
        except json.JSONDecodeError as e:
            logger.error("json_decode_error", response=response, error=str(e))
            return {}
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def create_embedding(self, text: str) -> List[float]:
        """
        Create text embedding using OpenAI's embedding model.
        
        Args:
            text: Text to embed
        
        Returns:
            List of floats (1536 dimensions for text-embedding-3-small)
        """
        try:
            logger.info("openai_embedding_request", text_length=len(text))
            
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text,
            )
            
            embedding = response.data[0].embedding
            logger.info("openai_embedding_success", dimensions=len(embedding))
            return embedding
            
        except Exception as e:
            logger.error("openai_embedding_error", error=str(e))
            raise ExternalServiceException("OpenAI Embeddings", str(e))
    
    async def create_car_embedding(self, car_data: Dict[str, Any]) -> List[float]:
        """
        Create embedding for a car based on its features.
        
        Args:
            car_data: Dict with car details (brand, model, type, features, etc.)
        
        Returns:
            Embedding vector
        """
        text_parts = []
        
        if car_data.get("brand"):
            text_parts.append(f"Brand: {car_data['brand']}")
        if car_data.get("model"):
            text_parts.append(f"Model: {car_data['model']}")
        if car_data.get("type"):
            text_parts.append(f"Type: {car_data['type']}")
        if car_data.get("year"):
            text_parts.append(f"Year: {car_data['year']}")
        if car_data.get("features"):
            features_str = ", ".join(car_data["features"])
            text_parts.append(f"Features: {features_str}")
        if car_data.get("description"):
            text_parts.append(f"Description: {car_data['description']}")
        
        text = " | ".join(text_parts)
        return await self.create_embedding(text)
