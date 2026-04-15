from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, default="medium")
    category = Column(String, default="general")
    estimated_time = Column(String, nullable=True)
    status = Column(String, default="todo")
    order = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
