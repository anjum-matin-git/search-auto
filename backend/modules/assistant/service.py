"""
Assistant conversation service using Claude.
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
from integrations.anthropic_client import AnthropicClient
from core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """Business logic for assistant chat conversations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.search_repo = SearchRepository(db)
        self.preferences_repo = UserPreferenceRepository(db)
        self.claude = AnthropicClient()
    
    def get_conversation(self, user_id: int) -> Tuple[Conversation, List[ConversationMessage]]:
        """Return conversation and ordered messages."""
        conversation = self.conversation_repo.get_or_create(user_id)
        messages = self.conversation_repo.list_messages(conversation.id)
        return conversation, messages
    
    async def send_message(
        self,
        user: User,
        message: str
    ) -> Tuple[Conversation, dict]:
        """Persist a user message, get Claude response, and store reply."""
        logger.info("assistant_message_received", user_id=user.id)
        conversation = self.conversation_repo.get_or_create(user.id)
        self.conversation_repo.add_message(conversation.id, role="user", content=message)
        search_query = self._extract_search_query(message)
        
        # Build prompt and get response
        system_prompt, messages_list = self._build_prompt(conversation.id, user, search_query)
        
        try:
            assistant_reply = await self.claude.chat_completion(
                messages_list, 
                system=system_prompt,
                max_tokens=512
            )
        except Exception as e:
            logger.error("claude_error", error=str(e))
            assistant_reply = "I'm having trouble responding right now. Please try again."
        
        self.conversation_repo.add_message(conversation.id, role="assistant", content=assistant_reply)
        
        messages = self.conversation_repo.list_messages(conversation.id)
        logger.info("assistant_message_completed", conversation_id=conversation.id, message_count=len(messages))
        
        return conversation, {
            "messages": messages,
            "next_search_query": search_query
        }
    
    def _build_prompt(self, conversation_id: int, user: User, search_query: Optional[str]) -> Tuple[str, List[dict]]:
        """Build Claude prompt with context."""
        latest_search = self.search_repo.get_latest_with_results(user.id)
        preferences = user.initial_preferences or {}
        structured_pref = self.preferences_repo.get_by_user(user.id)
        
        # Build context
        context_parts = []
        
        if latest_search:
            _, car_results = latest_search
            if car_results:
                summaries = []
                for car, match_score in car_results[:3]:
                    data = car.car_data
                    summaries.append(
                        f"{data.get('year', '2024')} {data.get('brand', '')} {data.get('model', '')} "
                        f"(${data.get('price', 'N/A')})"
                    )
                context_parts.append("Recent search results: " + "; ".join(summaries))
        
        if preferences:
            context_parts.append(f"User preferences: {preferences}")
        if structured_pref:
            context_parts.append(
                f"Preferred brands: {structured_pref.preferred_brands or []}, "
                f"types: {structured_pref.preferred_types or []}"
            )
        if user.location or user.postal_code:
            context_parts.append(f"Location: {user.location or user.postal_code}")
        
        # System prompt
        system_prompt = """You are SearchAuto's car-buying concierge. Be helpful, concise, and friendly.

Guidelines:
- Give brief, actionable answers (2-3 sentences max)
- Focus on the user's most recent question
- Suggest specific next steps when relevant
- If they want to search, confirm and summarize what you'll look for

""" + "\n".join(context_parts)
        
        if search_query:
            system_prompt += f"\n\nThe user wants to search for: {search_query}. Confirm you're triggering this search."
        
        # Get conversation history
        history = self.conversation_repo.list_messages(conversation_id, limit=8)
        formatted_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history
        ]
        
        return system_prompt, formatted_history

    def _extract_search_query(self, message: str) -> Optional[str]:
        """Extract search query from message if present."""
        lowered = message.lower()
        
        # Check for search intent
        search_keywords = ["search", "find", "look for", "show me", "new search", "looking for"]
        if not any(kw in lowered for kw in search_keywords):
            return None
        
        # Extract query patterns
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
        
        # Fallback: if message is short and has search keyword, use whole message
        if len(message.split()) <= 6:
            return message.strip()
        
        return None
