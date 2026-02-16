from pydantic import BaseModel
from typing import Optional


class MessageCreate(BaseModel):
    message: str
    attachment: list[str] = []
    thread_id: str
    sender: str = "vendor"


class MessageUpdate(BaseModel):
    message: Optional[str] = None
    attachment: Optional[list[str]] = None
    thread_id: Optional[str] = None
    sender: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    message: str
    attachment: list[str] = []
    thread_id: str
    sender: str = "vendor"
