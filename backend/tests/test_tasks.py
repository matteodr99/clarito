import pytest
from unittest.mock import MagicMock, patch
from app.models import Task
from datetime import datetime

def test_get_tasks_empty(client):
    response = client.get("/api/tasks/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_task(client):
    mock_suggestion = MagicMock()
    mock_suggestion.priority = "high"
    mock_suggestion.category = "work"
    mock_suggestion.estimated_time = "2 hours"

    with patch("app.routers.tasks.get_ai_suggestion", return_value=mock_suggestion):
        response = client.post("/api/tasks/", json={
            "title": "New task",
            "description": "A new task"
        })

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New task"
    assert data["priority"] == "high"
    assert data["category"] == "work"

def test_get_task_not_found(client):
    response = client.get("/api/tasks/999")
    assert response.status_code == 404

def test_get_task_found(client):
    mock_suggestion = MagicMock()
    mock_suggestion.priority = "medium"
    mock_suggestion.category = "study"
    mock_suggestion.estimated_time = "1 hour"

    with patch("app.routers.tasks.get_ai_suggestion", return_value=mock_suggestion):
        client.post("/api/tasks/", json={"title": "Study task", "description": "Study"})

    response = client.get("/api/tasks/1")
    assert response.status_code == 200
    assert response.json()["title"] == "Study task"

def test_delete_task_not_found(client):
    response = client.delete("/api/tasks/999")
    assert response.status_code == 404

def test_delete_task_success(client):
    mock_suggestion = MagicMock()
    mock_suggestion.priority = "low"
    mock_suggestion.category = "personal"
    mock_suggestion.estimated_time = "30 minutes"

    with patch("app.routers.tasks.get_ai_suggestion", return_value=mock_suggestion):
        client.post("/api/tasks/", json={"title": "Task to delete", "description": "Delete me"})

    response = client.delete("/api/tasks/1")
    assert response.status_code == 200
    assert response.json()["message"] == "Task deleted successfully"

def test_update_task_status(client):
    mock_suggestion = MagicMock()
    mock_suggestion.priority = "medium"
    mock_suggestion.category = "work"
    mock_suggestion.estimated_time = "1 hour"

    with patch("app.routers.tasks.get_ai_suggestion", return_value=mock_suggestion):
        client.post("/api/tasks/", json={"title": "Task to update"})

    response = client.patch("/api/tasks/1", json={"status": "in progress"})
    assert response.status_code == 200
    assert response.json()["status"] == "in progress"