from unittest.mock import MagicMock, patch


def _ai_suggestion(priority: str, category: str, estimated_time: str) -> MagicMock:
    suggestion = MagicMock()
    suggestion.priority = priority
    suggestion.category = category
    suggestion.estimated_time = estimated_time
    return suggestion


def test_task_lifecycle_integration(client):
    suggestions = [
        _ai_suggestion("high", "work", "2 hours"),
        _ai_suggestion("low", "personal", "30 minutes"),
    ]

    with patch("app.routers.tasks.get_ai_suggestion", side_effect=suggestions):
        first = client.post(
            "/api/tasks/",
            json={"title": "Prepare demo", "description": "Slides and speaking notes"},
        )
        second = client.post(
            "/api/tasks/",
            json={"title": "Buy groceries", "description": "Milk and bread"},
        )

    assert first.status_code == 200
    assert second.status_code == 200

    first_id = first.json()["id"]
    second_id = second.json()["id"]

    update = client.patch(
        f"/api/tasks/{first_id}",
        json={"status": "in progress", "estimated_time": "3 hours"},
    )
    assert update.status_code == 200
    assert update.json()["status"] == "in progress"
    assert update.json()["estimated_time"] == "3 hours"

    get_first = client.get(f"/api/tasks/{first_id}")
    assert get_first.status_code == 200
    assert get_first.json()["title"] == "Prepare demo"
    assert get_first.json()["priority"] == "high"

    all_tasks = client.get("/api/tasks/")
    assert all_tasks.status_code == 200
    assert [task["id"] for task in all_tasks.json()] == [first_id, second_id]

    delete_first = client.delete(f"/api/tasks/{first_id}")
    assert delete_first.status_code == 200
    assert delete_first.json()["message"] == "Task deleted successfully"

    remaining = client.get("/api/tasks/")
    assert remaining.status_code == 200
    assert [task["id"] for task in remaining.json()] == [second_id]


def test_reorder_integration_persists_order(client):
    suggestions = [
        _ai_suggestion("medium", "study", "1 hour"),
        _ai_suggestion("high", "urgent", "45 minutes"),
        _ai_suggestion("low", "personal", "20 minutes"),
    ]

    with patch("app.routers.tasks.get_ai_suggestion", side_effect=suggestions):
        first = client.post("/api/tasks/", json={"title": "Task A"})
        second = client.post("/api/tasks/", json={"title": "Task B"})
        third = client.post("/api/tasks/", json={"title": "Task C"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 200

    first_id = first.json()["id"]
    second_id = second.json()["id"]
    third_id = third.json()["id"]

    reorder = client.post(
        "/api/tasks/reorder",
        json={"ordered_ids": [third_id, first_id, second_id]},
    )
    assert reorder.status_code == 200
    assert [task["id"] for task in reorder.json()] == [third_id, first_id, second_id]

    all_tasks = client.get("/api/tasks/")
    assert all_tasks.status_code == 200
    data = all_tasks.json()
    assert [task["id"] for task in data] == [third_id, first_id, second_id]
    assert [task["order"] for task in data] == [0, 1, 2]
