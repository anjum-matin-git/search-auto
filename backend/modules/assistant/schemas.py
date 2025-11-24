"""
Schemas for assistant conversation endpoints.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AssistantMessage(BaseModel):
    """Represents a single chat message."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: str
    content: str
    created_at: datetime = Field(alias="createdAt")


class ConversationResponse(BaseModel):
    """Conversation payload returned to the client."""
    
    conversation_id: int = Field(alias="conversationId")
    title: str
    messages: List[AssistantMessage]
    next_search_query: Optional[str] = Field(default=None, alias="nextSearchQuery")


class AssistantMessageRequest(BaseModel):
    """Incoming user message."""
    
    message: str = Field(..., min_length=1, max_length=2000)

