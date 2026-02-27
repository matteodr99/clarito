from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import Optional
from google import genai
from mangum import Mangum
import os
import json
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, default="medium")
    category = Column(String, default="general")
    estimated_time = Column(String, nullable=True)
    status = Column(String, default="todo")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    estimated_time: Optional[str] = None
    status: Optional[str] = None

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_ai_suggestion(title: str, description: str = ""):
    prompt = f"""
    Analyze this task and respond ONLY with valid JSON, no markdown, no backticks.
    Task: {title}
    Description: {description}
    Respond exactly in this format:
    {{"priority": "high|medium|low", "category": "work|personal|urgent|study|other", "estimated_time": "e.g. 30 minutes, 2 hours, 1 day"}}
    """
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    return json.loads(response.text.strip())

@app.get("/api/tasks")
def get_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).all()
        return [{"id": t.id, "title": t.title, "description": t.description,
                 "priority": t.priority, "category": t.category,
                 "estimated_time": t.estimated_time, "status": t.status,
                 "created_at": t.created_at.isoformat()} for t in tasks]
    finally:
        db.close()

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    db = SessionLocal()
    try:
        suggestion = get_ai_suggestion(task.title, task.description or "")
        db_task = Task(
            title=task.title,
            description=task.description,
            priority=suggestion["priority"],
            category=suggestion["category"],
            estimated_time=suggestion["estimated_time"]
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return {"id": db_task.id, "title": db_task.title, "description": db_task.description,
                "priority": db_task.priority, "category": db_task.category,
                "estimated_time": db_task.estimated_time, "status": db_task.status,
                "created_at": db_task.created_at.isoformat()}
    finally:
        db.close()

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return {"error": "Task not found"}
        return {"id": task.id, "title": task.title, "description": task.description,
                "priority": task.priority, "category": task.category,
                "estimated_time": task.estimated_time, "status": task.status,
                "created_at": task.created_at.isoformat()}
    finally:
        db.close()

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return {"error": "Task not found"}
        for field, value in task_update.model_dump(exclude_unset=True).items():
            setattr(task, field, value)
        db.commit()
        db.refresh(task)
        return {"id": task.id, "title": task.title, "description": task.description,
                "priority": task.priority, "category": task.category,
                "estimated_time": task.estimated_time, "status": task.status,
                "created_at": task.created_at.isoformat()}
    finally:
        db.close()

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return {"error": "Task not found"}
        db.delete(task)
        db.commit()
        return {"message": "Task deleted successfully"}
    finally:
        db.close()
