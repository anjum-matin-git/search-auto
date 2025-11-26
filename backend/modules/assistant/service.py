"""
Assistant conversation service.
Handles chat interactions with Claude.
"""
from typing import List, Tuple, Optional
import re

from sqlalchemy.orm import Session

from db.models import Conversation, ConversationMessage, User
from db.repositories import (
    ConversationRepository,
    SearchRepository,
    UserPreferenceRepository,
)
from integrations.anthropic_client import ClaudeClient
from core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """Manages assistant chat conversations."""
    
    def __init__(self, db: Session):
        self._db = db
        self._conversation_repo = ConversationRepository(db)
        self._search_repo = SearchRepository(db)
        self._preference_repo = UserPreferenceRepository(db)
        self._claude = ClaudeClient()
    
    def get_conversation(
        self,
        user_id: int
    ) -> Tuple[Conversation, List[ConversationMessage]]:
        """Get or create conversation with messages."""
        conversation = self._conversation_repo.get_or_create(user_id)
        messages = self._conversation_repo.list_messages(conversation.id)
        return conversation, messages
    
    async def send_message(
        self,
        user: User,
        message: str
    ) -> Tuple[Conversation, dict]:
        """
        Process user message and get AI response.
        
        Args:
            user: Current user
            message: User's message
        
        Returns:
            Tuple of (conversation, response_data)
        """
        logger.info("message_received", user_id=user.id)
        
        conversation = self._conversation_repo.get_or_create(user.id)
        self._conversation_repo.add_message(conversation.id, role="user", content=message)
        
        # Check for search intent
        search_query = self._extract_search_intent(message)
        
        # Build prompt and get response
        system_prompt, messages = self._build_prompt(conversation.id, user, search_query)
        
        try:
            response = await self._claude.complete(
                messages,
                system_prompt=system_prompt,
                max_tokens=512
            )
        except Exception as e:
            logger.error("assistant_error", error=str(e))
            response = "I'm having trouble responding. Please try again."
        
        self._conversation_repo.add_message(conversation.id, role="assistant", content=response)
        
        all_messages = self._conversation_repo.list_messages(conversation.id)
        
        logger.info("message_complete", conversation_id=conversation.id)
        
        return conversation, {
            "messages": all_messages,
            "next_search_query": search_query
        }
    
    def _build_prompt(
        self,
        conversation_id: int,
        user: User,
        search_query: Optional[str]
    ) -> Tuple[str, List[dict]]:
        """Build Claude prompt with context."""
        context_parts = []
        
        # Add search context with detailed results
        latest_search = self._search_repo.get_latest_with_results(user.id)
        if latest_search:
            search_obj, car_results = latest_search
            if car_results:
                context_parts.append(f"User's last search query: '{search_obj.query}'")
                summaries = []
                for car, score in car_results[:5]:  # Include top 5 for better context
                    data = car.car_data
                    price = data.get('price', 'N/A')
                    price_str = f"${price:,}" if isinstance(price, (int, float)) else price
                    summaries.append(
                        f"{data.get('year')} {data.get('brand')} {data.get('model')} - {price_str} - {data.get('location', 'Location N/A')}"
                    )
                context_parts.append("Current search results:\n" + "\n".join([f"  {i+1}. {s}" for i, s in enumerate(summaries)]))
        
        # Add preferences
        prefs = user.initial_preferences or {}
        if prefs:
            context_parts.append(f"Preferences: {prefs}")
        
        structured_pref = self._preference_repo.get_by_user(user.id)
        if structured_pref:
            context_parts.append(
                f"Brands: {structured_pref.preferred_brands or []}, "
                f"Types: {structured_pref.preferred_types or []}"
            )
        
        if user.location or user.postal_code:
            context_parts.append(f"Location: {user.location or user.postal_code}")
        
        # Build system prompt
        system_prompt = """You are SearchAuto's car concierge. Be helpful, concise, and friendly.

CRITICAL RULES:
- ALWAYS read the conversation history before responding
- Answer based on the CURRENT conversation context - do NOT hallucinate or make up details
- If the user asks about a specific brand/model they just searched, reference the ACTUAL search results provided
- If search results are provided, base your recommendations ONLY on those results
- Keep responses to 2-3 sentences
- Focus on the user's current question in context of the conversation
- If they ask "which X would be best" - analyze the search results they just received, not unrelated cars

"""
        if context_parts:
            system_prompt += "\nContext:\n" + "\n".join(context_parts) + "\n"
        
        if search_query:
            system_prompt += f"\nUser wants to search for: {search_query}. Confirm you're starting this search."
        
        # Get conversation history
        history = self._conversation_repo.list_messages(conversation_id, limit=8)
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in history
        ]
        
        return system_prompt, messages
    
    def _extract_search_intent(self, message: str) -> Optional[str]:
        """Extract search query if user wants to search."""
        message_lower = message.lower()
        
        search_keywords = ["search", "find", "look for", "show me", "looking for"]
        if not any(kw in message_lower for kw in search_keywords):
            return None
        
        patterns = [
            r"(?:new )?search(?: for)? (?P<query>.+)",
            r"find(?: me)? (?P<query>.+)",
            r"look(?:ing)? for (?P<query>.+)",
            r"show me (?P<query>.+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, flags=re.IGNORECASE)
            if match:
                query = match.group("query").strip(" ?.!,")
                if query and len(query) > 2:
                    return query
        
        # Short messages with search keywords
        if len(message.split()) <= 6:
            return message.strip()
        
        return None
