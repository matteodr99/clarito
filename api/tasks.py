from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import urlparse, parse_qs
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from google import genai
from datetime import datetime

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

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def task_to_dict(t):
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "priority": t.priority, "category": t.category,
        "estimated_time": t.estimated_time, "status": t.status,
        "created_at": t.created_at.isoformat()
    }

def get_ai_suggestion(title, description=""):
    prompt = f"""
    Analyze this task and respond ONLY with valid JSON, no markdown, no backticks.
    Task: {title}
    Description: {description}
    Respond exactly in this format:
    {{"priority": "high|medium|low", "category": "work|personal|urgent|study|other", "estimated_time": "e.g. 30 minutes, 2 hours, 1 day"}}
    """
    response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    return json.loads(response.text.strip())

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, data, status=200):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _get_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def _get_task_id(self):
        parts = self.path.split("/")
        try:
            return int(parts[-1])
        except ValueError:
            return None

    def do_GET(self):
        db = SessionLocal()
        try:
            task_id = self._get_task_id()
            if task_id:
                task = db.query(Task).filter(Task.id == task_id).first()
                if not task:
                    return self._send_json({"error": "Task not found"}, 404)
                return self._send_json(task_to_dict(task))
            tasks = db.query(Task).all()
            return self._send_json([task_to_dict(t) for t in tasks])
        finally:
            db.close()

    def do_POST(self):
        db = SessionLocal()
        try:
            body = self._get_body()
            suggestion = get_ai_suggestion(body.get("title", ""), body.get("description", ""))
            task = Task(
                title=body["title"],
                description=body.get("description"),
                priority=suggestion["priority"],
                category=suggestion["category"],
                estimated_time=suggestion["estimated_time"]
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            return self._send_json(task_to_dict(task))
        finally:
            db.close()

    def do_PATCH(self):
        db = SessionLocal()
        try:
            task_id = self._get_task_id()
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return self._send_json({"error": "Task not found"}, 404)
            body = self._get_body()
            for field, value in body.items():
                setattr(task, field, value)
            db.commit()
            db.refresh(task)
            return self._send_json(task_to_dict(task))
        finally:
            db.close()

    def do_DELETE(self):
        db = SessionLocal()
        try:
            task_id = self._get_task_id()
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return self._send_json({"error": "Task not found"}, 404)
            db.delete(task)
            db.commit()
            return self._send_json({"message": "Task deleted successfully"})
        finally:
            db.close()
