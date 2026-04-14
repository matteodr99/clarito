from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    estimated_time: Optional[str] = None
    status: Optional[str] = None
    order: Optional[int] = None


class TaskReorder(BaseModel):
    ordered_ids: List[int]


class AISuggestion(BaseModel):
    priority: str
    category: str
    estimated_time: str


class TaskResponse(TaskBase):
    id: int
    priority: str
    category: str
    estimated_time: Optional[str]
    status: str
    order: Optional[int]
    created_at: datetime

    class ConfigDict:
        from_attributes = True
