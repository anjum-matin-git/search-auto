"""
Assistant conversation service orchestrating OpenAI responses.
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
from integrations.openai_client import OpenAIClient
from core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """Business logic for assistant chat conversations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.conversation_repo = ConversationRepository(db)
        self.search_repo = SearchRepository(db)
        self.preferences_repo = UserPreferenceRepository(db)
        self.openai = OpenAIClient()
    
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
        """Persist a user message, run OpenAI, and store assistant reply."""
        logger.info("assistant_message_received", user_id=user.id)
        conversation = self.conversation_repo.get_or_create(user.id)
        self.conversation_repo.add_message(conversation.id, role="user", content=message)
        search_query = self._extract_search_query(message)
        
        prompt_messages = await self._build_prompt(conversation.id, user, search_query)
        assistant_reply = await self.openai.chat_completion(prompt_messages)
        self.conversation_repo.add_message(conversation.id, role="assistant", content=assistant_reply)
        
        messages = self.conversation_repo.list_messages(conversation.id)
        logger.info("assistant_message_completed", conversation_id=conversation.id, message_count=len(messages))
        return conversation, {
            "messages": messages,
            "next_search_query": search_query
        }
    
    async def _build_prompt(self, conversation_id: int, user: User, search_query: Optional[str]) -> List[dict]:
        """Compose OpenAI prompt using history + latest car data."""
        latest_search = self.search_repo.get_latest_with_results(user.id)
        preferences = user.initial_preferences or {}
        structured_pref = self.preferences_repo.get_by_user(user.id)
        
        search_context = ""
        if latest_search:
            _, car_results = latest_search
            if car_results:
                summaries = []
                for car, match_score in car_results[:3]:
                    data = car.car_data
                    summaries.append(
                        f"{data.get('year', '2024')} {data.get('brand', '')} {data.get('model', '')} "
                        f"(${data.get('price', 'N/A')} • match {int((match_score or 0)*100)}%)"
                    )
                search_context = "Recent matches: " + "; ".join(summaries)
        
        pref_lines = []
        if preferences:
            pref_lines.append(f"Signup preferences: {preferences}")
        if structured_pref:
            pref_lines.append(
                f"Learned prefs - brands: {structured_pref.preferred_brands or []}, "
                f"types: {structured_pref.preferred_types or []}, "
                f"budget: {structured_pref.price_range_min} - {structured_pref.price_range_max}"
            )
        if user.location or user.postal_code:
            pref_lines.append(f"User location: {user.location or user.postal_code}")
        
        latest_user_message = None
        history = self.conversation_repo.list_messages(conversation_id, limit=12)
        for message in reversed(history):
            if message.role == "user":
                latest_user_message = message.content
                break

        system_prompt = (
            "You are SearchAuto's expert car-buying concierge. "
            "Give concise, friendly answers, suggest concrete next steps, "
            "and keep track of budget, location, and vehicle preferences. "
            "Always mention if the user should upgrade for unlimited searches when relevant. "
            "Always prioritize the user's most recent question even if it contradicts earlier topics; "
            "never revert to an older vehicle or location unless the user brings it back up."
        )
        if search_query:
            system_prompt += (
                f" The user is asking for a fresh search with this query: {search_query}. "
                "Confirm you are triggering it and summarize what they'll see."
            )
        if latest_user_message:
            system_prompt += (
                f" The latest user request is: \"{latest_user_message}\". "
                "Ensure your answer addresses this exact message before referencing older context."
            )
        
        context_prompt = "\n".join(filter(None, [system_prompt, *pref_lines, search_context]))
        
        formatted_history = [
            {"role": message.role, "content": message.content}
            for message in history
        ]
        
        return [
            {"role": "system", "content": context_prompt},
            *formatted_history,
        ]

    def _extract_search_query(self, message: str) -> Optional[str]:
        """Infer if the user is asking for a new search and extract the query."""
        lowered = message.lower()
        if any(keyword in lowered for keyword in ["search", "find", "look for", "show me", "new search"]):
            patterns = [
                r"new search for (?P<query>.+)",
                r"search(?: for)? (?P<query>.+)",
                r"find(?: me)? (?P<query>.+)",
                r"look for (?P<query>.+)",
                r"show me (?P<query>.+)",
            ]
            for pattern in patterns:
                match = re.search(pattern, message, flags=re.IGNORECASE)
                if match:
                    query = match.group("query").strip(" ?.!,")
                    if query:
                        return query
            if len(message.split()) > 2:
                return message.strip()
        return None

