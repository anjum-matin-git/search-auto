"""
Assistant conversation service.
Handles chat interactions with Claude.
"""
from typing import List, Tuple

from sqlalchemy.orm import Session

from db.models import Conversation, ConversationMessage, User
from db.repositories import ConversationRepository, SearchRepository
from integrations.anthropic_client import ClaudeClient
from core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """Manages assistant chat conversations."""
    
    def __init__(self, db: Session):
        self._db = db
        self._conversation_repo = ConversationRepository(db)
        self._search_repo = SearchRepository(db)
        self._claude = ClaudeClient()
    
    def get_conversation(self, user_id: int) -> Tuple[Conversation, List[ConversationMessage]]:
        """Get or create conversation with messages."""
        conversation = self._conversation_repo.get_or_create(user_id)
        messages = self._conversation_repo.list_messages(conversation.id)
        return conversation, messages
    
    async def send_message(self, user: User, message: str) -> Tuple[Conversation, dict]:
        """Process user message and get AI response."""
        conversation = self._conversation_repo.get_or_create(user.id)
        self._conversation_repo.add_message(conversation.id, role="user", content=message)
        
        # Build prompt with search context
        system_prompt = self._build_system_prompt(user.id)
        history = self._conversation_repo.list_messages(conversation.id, limit=10)
        messages = [{"role": msg.role, "content": msg.content} for msg in history]
        
        try:
            response = await self._claude.complete(messages, system_prompt=system_prompt, max_tokens=300)
        except Exception as e:
            logger.error("assistant_error", error=str(e))
            response = "I'm having trouble responding. Please try again."
        
        self._conversation_repo.add_message(conversation.id, role="assistant", content=response)
        all_messages = self._conversation_repo.list_messages(conversation.id)
        
        return conversation, {"messages": all_messages}
    
    def _build_system_prompt(self, user_id: int) -> str:
        """Build system prompt with search results context."""
        prompt = "You are SearchAuto's AI assistant. Help users with car questions based on their search results.\n\n"
        
        # Add search results if available
        latest_search = self._search_repo.get_latest_with_results(user_id)
        if latest_search:
            search_obj, car_results = latest_search
            if car_results:
                prompt += f"User's last search: '{search_obj.query}'\n\nAvailable cars:\n"
                for i, (car, score) in enumerate(car_results[:5], 1):
                    data = car.car_data
                    price = f"${data.get('price', 0):,}" if data.get('price') else "Contact dealer"
                    prompt += f"{i}. {data.get('year')} {data.get('brand')} {data.get('model')} - {price}\n"
                prompt += "\nOnly recommend from these cars. Keep responses short (2-3 sentences)."
            else:
                prompt += "No search results available. Ask the user to search for cars first."
        else:
            prompt += "No search results available. Ask the user to search for cars first."
        
        return prompt
