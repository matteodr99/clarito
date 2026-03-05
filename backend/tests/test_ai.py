import pytest
from unittest.mock import MagicMock, patch
from app.routers.tasks import get_ai_suggestion

def test_get_ai_suggestion_returns_correct_fields():
    mock_response = MagicMock()
    mock_response.text = '{"priority": "high", "category": "work", "estimated_time": "2 hours"}'

    with patch("app.routers.tasks.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response
        result = get_ai_suggestion("Fix critical bug", "Production is down")

    assert result.priority == "high"
    assert result.category == "work"
    assert result.estimated_time == "2 hours"

def test_get_ai_suggestion_with_empty_description():
    mock_response = MagicMock()
    mock_response.text = '{"priority": "low", "category": "personal", "estimated_time": "30 minutes"}'

    with patch("app.routers.tasks.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response
        result = get_ai_suggestion("Buy groceries")

    assert result.priority == "low"
    assert result.category == "personal"

def test_get_ai_suggestion_invalid_json_raises():
    mock_response = MagicMock()
    mock_response.text = "invalid json"

    with patch("app.routers.tasks.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response
        with pytest.raises(Exception):
            get_ai_suggestion("Some task")