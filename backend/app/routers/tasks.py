import json
from typing import List
from datetime import datetime

from google import genai
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db
from ..models import Task
from ..schemas import TaskCreate, TaskUpdate, TaskResponse, AISuggestion, TaskReorder
from ..config import config

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

client = genai.Client(api_key=config.GEMINI_API_KEY)


def get_ai_suggestion(title: str, description: str = "") -> AISuggestion:
    prompt = f"""
    Analyze this task and respond ONLY with valid JSON, no markdown, no backticks.

    Task: {title}
    Description: {description}

    Respond exactly in this format:
    {{"priority": "high|medium|low", "category": "work|personal|urgent|study|other", "estimated_time": "e.g. 30 minutes, 2 hours, 1 day"}}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    data = json.loads(response.text.strip())
    return AISuggestion(**data)


@router.get("/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    # Tasks with an explicit order come first (sorted by order),
    # then tasks without order fall back to created_at desc.
    tasks = db.query(Task).all()
    tasks.sort(key=lambda t: (t.order is None, t.order if t.order is not None else 0, t.created_at))
    return tasks


@router.post("/reorder", response_model=List[TaskResponse])
def reorder_tasks(payload: TaskReorder, db: Session = Depends(get_db)):
    """Accept an ordered list of task IDs and persist their new order."""
    for position, task_id in enumerate(payload.ordered_ids):
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.order = position
    db.commit()
    tasks = db.query(Task).all()
    tasks.sort(key=lambda t: (t.order is None, t.order if t.order is not None else 0, t.created_at))
    return tasks


@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    suggestion = get_ai_suggestion(task.title, task.description or "")

    # New tasks go to the end of the list
    max_order = db.query(Task).count()

    db_task = Task(
        title=task.title,
        description=task.description,
        priority=suggestion.priority,
        category=suggestion.category,
        estimated_time=suggestion.estimated_time,
        order=max_order,
        created_at=datetime.utcnow()
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
