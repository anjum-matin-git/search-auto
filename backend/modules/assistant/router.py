"""
Assistant conversation API endpoints.
"""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import User
from core.jwt_auth import get_current_user_jwt
from .schemas import AssistantMessageRequest, ConversationResponse, AssistantMessage
from .service import AssistantService

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


def _serialize(conversation, messages, next_search_query: Optional[str] = None) -> ConversationResponse:
    """Convert ORM objects to response schema."""
    message_payload = [
        AssistantMessage(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            createdAt=msg.created_at
        )
        for msg in messages
    ]
    
    return ConversationResponse(
        conversationId=conversation.id,
        title=conversation.title or "AI Agent",
        messages=message_payload,
        nextSearchQuery=next_search_query
    )


@router.get("", response_model=ConversationResponse)
def get_conversation(
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """Return the current user's assistant conversation."""
    service = AssistantService(db)
    conversation, messages = service.get_conversation(current_user.id)
    return _serialize(conversation, messages)


@router.post("/message", response_model=ConversationResponse)
async def send_message(
    request: AssistantMessageRequest,
    current_user: User = Depends(get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """Send a message to the assistant and receive an updated conversation transcript."""
    service = AssistantService(db)
    conversation, data = await service.send_message(current_user, request.message)
    return _serialize(conversation, data["messages"], data.get("next_search_query"))

