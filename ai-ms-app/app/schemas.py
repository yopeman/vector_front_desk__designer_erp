from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)


class SessionUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class Session(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ChatCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20000)


class Chat(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime


class ChatExchange(BaseModel):
    user_message: Chat
    assistant_message: Chat


class Attachment(BaseModel):
    id: str
    session_id: str
    name: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    chunk_count: Optional[int] = None
    created_at: datetime