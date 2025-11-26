"""
Assistant conversation service.
Handles chat interactions with Claude.
"""
from typing import List, Tuple, Dict, Any

from sqlalchemy.orm import Session

from db.models import Conversation, ConversationMessage, User
from db.repositories import ConversationRepository, SearchRepository
from integrations.anthropic_client import ClaudeClient
from core.logging import get_logger

logger = get_logger(__name__)


class AssistantService:
    """
    Manages assistant chat interactions.
    Optimized for efficiency and reduced hallucination.
    """
    
    def __init__(self, db: Session):
        self._db = db
        self._conversation_repo = ConversationRepository(db)
        self._search_repo = SearchRepository(db)
        self._claude = ClaudeClient()
    
    def get_conversation(self, user_id: int) -> Tuple[Conversation, List[ConversationMessage]]:
        """Get conversation state efficiently."""
        conversation = self._conversation_repo.get_or_create(user_id)
        messages = self._conversation_repo.list_messages(conversation.id, limit=50)
        return conversation, messages
    
    async def send_message(self, user: User, message: str) -> Tuple[Conversation, Dict[str, Any]]:
        """
        Process user message and generate AI response.
        Uses latest search context to ground the answer.
        """
        # 1. Get/Create Conversation
        conversation = self._conversation_repo.get_or_create(user.id)
        self._conversation_repo.add_message(conversation.id, role="user", content=message)
        
        # 2. Build Optimized Context
        # We fetch only necessary history to save tokens
        history = self._conversation_repo.list_messages(conversation.id, limit=8)
        formatted_history = [{"role": msg.role, "content": msg.content} for msg in history]
        
        system_prompt = self._build_system_prompt(user.id)
        
        # 3. Get Response from Claude
        try:
            response = await self._claude.complete(
                messages=formatted_history,
                system_prompt=system_prompt,
                max_tokens=350,  # Enough for detailed but concise answers
                temperature=0.7  # Balanced creativity/accuracy
            )
        except Exception as e:
            logger.error(f"Claude API error for user {user.id}: {str(e)}")
            response = "I'm having trouble accessing the AI service right now. Please try again in a moment."
        
        # 4. Save & Return
        self._conversation_repo.add_message(conversation.id, role="assistant", content=response)
        
        # Return full message list for UI update
        all_messages = self._conversation_repo.list_messages(conversation.id)
        
        return conversation, {"messages": all_messages}
    
    def _build_system_prompt(self, user_id: int) -> str:
        """
        Builds a robust, context-aware system prompt.
        Focuses on grounding the AI in the user's actual search results.
        """
        # Base Persona
        prompt = (
            "You are SearchAuto's Expert Car Concierge. "
            "Your goal is to help users find their perfect car using the search results provided.\n\n"
        )
        
        # Dynamic Context Injection
        latest_search = self._search_repo.get_latest_with_results(user_id)
        
        if latest_search and latest_search[1]:
            search_obj, car_results = latest_search
            
            prompt += f"### CURRENT USER CONTEXT\n"
            prompt += f"Last Search: '{search_obj.query}'\n\n"
            
            prompt += "### AVAILABLE INVENTORY (Use these EXCLUSIVELY)\n"
            for i, (car, _) in enumerate(car_results[:5], 1):
                data = car.car_data
                # Format: 1. 2020 BMW X5 - $45,000 - 45k miles - NY
                price = f"${data.get('price', 0):,}" if data.get('price') else "Price TBD"
                location = data.get('location', 'N/A')
                
                # Extract top 3 relevant features for context
                features = data.get('features', [])[:3]
                features_str = f"[{', '.join(features)}]" if features else ""
                
                prompt += (
                    f"{i}. {data.get('year')} {data.get('brand')} {data.get('model')} "
                    f"| {price} | {location} {features_str}\n"
                )
            
            prompt += "\n"
            prompt += (
                "### GUIDELINES\n"
                "1. RECOMMENDATIONS: Only recommend cars from the list above. If none match, say so.\n"
                "2. COMPARISONS: Compare specific vehicles from the list (e.g., 'The 2020 BMW (#1) has better features than...').\n"
                "3. HALLUCINATIONS: Do not invent cars. If the user asks about a Tesla and you only have BMWs, tell them to search for Teslas first.\n"
                "4. TONE: Professional, helpful, and concise (2-3 sentences).\n"
            )
        else:
            prompt += (
                "### STATUS\n"
                "The user has not performed a search yet, or no results were found.\n\n"
                "### GUIDELINES\n"
                "- Politely ask the user to search for a car using the search bar first.\n"
                "- You cannot recommend specific cars until they perform a search.\n"
                "- You can answer general automotive questions (e.g., 'What is a good family SUV?').\n"
            )
            
        return prompt
