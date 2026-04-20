from unittest.mock import MagicMock, patch


def _mock_ai_suggestion(priority="medium", category="other", estimated_time="1 hour"):
    suggestion = MagicMock()
    suggestion.priority = priority
    suggestion.category = category
    suggestion.estimated_time = estimated_time
    return suggestion


def test_task_lifecycle_integration(client):
    with patch(
        "app.routers.tasks.get_ai_suggestion",
        side_effect=[
            _mock_ai_suggestion(priority="high", category="work", estimated_time="2 hours"),
            _mock_ai_suggestion(priority="low", category="personal", estimated_time="30 minutes"),
            _mock_ai_suggestion(priority="medium", category="study", estimated_time="45 minutes"),
        ],
    ):
        create_first = client.post("/api/tasks/", json={"title": "First task", "description": "First desc"})
        create_second = client.post("/api/tasks/", json={"title": "Second task"})
        create_third = client.post("/api/tasks/", json={"title": "Third task"})

    assert create_first.status_code == 200
    assert create_second.status_code == 200
    assert create_third.status_code == 200

    first = create_first.json()
    second = create_second.json()
    third = create_third.json()

    assert first["order"] == 0
    assert second["order"] == 1
    assert third["order"] == 2

    list_response = client.get("/api/tasks/")
    assert list_response.status_code == 200
    listed_ids = [task["id"] for task in list_response.json()]
    assert listed_ids == [first["id"], second["id"], third["id"]]

    reorder_response = client.post(
        "/api/tasks/reorder", json={"ordered_ids": [third["id"], first["id"], second["id"]]}
    )
    assert reorder_response.status_code == 200
    reordered_ids = [task["id"] for task in reorder_response.json()]
    assert reordered_ids == [third["id"], first["id"], second["id"]]
    reordered_orders = {task["id"]: task["order"] for task in reorder_response.json()}
    assert reordered_orders[third["id"]] == 0
    assert reordered_orders[first["id"]] == 1
    assert reordered_orders[second["id"]] == 2

    update_response = client.patch(
        f"/api/tasks/{third['id']}",
        json={"status": "done", "priority": "high", "category": "urgent"},
    )
    assert update_response.status_code == 200
    updated_task = update_response.json()
    assert updated_task["status"] == "done"
    assert updated_task["priority"] == "high"
    assert updated_task["category"] == "urgent"

    delete_response = client.delete(f"/api/tasks/{first['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Task deleted successfully"

    get_deleted_response = client.get(f"/api/tasks/{first['id']}")
    assert get_deleted_response.status_code == 404

    final_list_response = client.get("/api/tasks/")
    assert final_list_response.status_code == 200
    final_ids = [task["id"] for task in final_list_response.json()]
    assert final_ids == [third["id"], second["id"]]


def test_reorder_ignores_unknown_ids_integration(client):
    with patch(
        "app.routers.tasks.get_ai_suggestion",
        return_value=_mock_ai_suggestion(priority="medium", category="other", estimated_time="1 hour"),
    ):
        first = client.post("/api/tasks/", json={"title": "A"}).json()
        second = client.post("/api/tasks/", json={"title": "B"}).json()

    reorder_response = client.post(
        "/api/tasks/reorder", json={"ordered_ids": [second["id"], 999_999, first["id"]]}
    )
    assert reorder_response.status_code == 200

    reordered = reorder_response.json()
    reordered_ids = [task["id"] for task in reordered]
    assert reordered_ids == [second["id"], first["id"]]
    assert reordered[0]["order"] == 0
    assert reordered[1]["order"] == 2
