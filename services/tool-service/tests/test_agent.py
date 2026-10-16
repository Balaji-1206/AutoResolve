"""
Unit & Integration Tests for Qwen Tool Calling Agent.
"""

import json
from unittest.mock import MagicMock, patch
import pytest
from app.tools.agent import QwenToolAgent, ToolCallingResult


def test_agent_initialization():
    """Verify QwenToolAgent initializes with default or custom settings."""
    agent = QwenToolAgent(base_url="http://localhost:11434/v1", model="qwen3:8b")
    assert agent.model == "qwen3:8b"
    assert "localhost:11434" in agent.base_url
    assert agent.dispatcher is not None


def test_agent_tool_calling_loop_mocked():
    """Verify two-turn tool calling conversation loop using mocked Ollama responses."""
    agent = QwenToolAgent()

    turn_1_response = {
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [
                        {
                            "id": "call_123",
                            "type": "function",
                            "function": {
                                "name": "get_order",
                                "arguments": json.dumps({"order_id": "ORD-1001"}),
                            },
                        }
                    ],
                },
                "finish_reason": "tool_calls",
            }
        ]
    }

    turn_2_response = {
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Your order ORD-1001 was delivered on September 16, 2026. The total amount is $120.00.",
                },
                "finish_reason": "stop",
            }
        ]
    }

    mock_client = MagicMock()
    mock_enter = MagicMock()
    mock_client.__enter__.return_value = mock_enter

    mock_resp_1 = MagicMock()
    mock_resp_1.status_code = 200
    mock_resp_1.json.return_value = turn_1_response

    mock_resp_2 = MagicMock()
    mock_resp_2.status_code = 200
    mock_resp_2.json.return_value = turn_2_response

    mock_enter.post.side_effect = [mock_resp_1, mock_resp_2]

    with patch("httpx.Client", return_value=mock_client):
        result = agent.run("Where is my order ORD-1001?")

    assert isinstance(result, ToolCallingResult)
    assert "ORD-1001" in result.answer
    assert len(result.tools_executed) == 1
    assert result.tools_executed[0]["tool_name"] == "get_order"
    assert result.tools_executed[0]["arguments"]["order_id"] == "ORD-1001"
    assert result.tools_executed[0]["result"]["success"] is True


def test_agent_direct_answer_no_tools_mocked():
    """Verify agent handles general questions without invoking tools."""
    agent = QwenToolAgent()

    direct_response = {
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Hello! I am AcmeCommerce's virtual assistant. How can I help you?",
                },
                "finish_reason": "stop",
            }
        ]
    }

    mock_client = MagicMock()
    mock_enter = MagicMock()
    mock_client.__enter__.return_value = mock_enter

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = direct_response
    mock_enter.post.return_value = mock_resp

    with patch("httpx.Client", return_value=mock_client):
        result = agent.run("Hello there!")

    assert isinstance(result, ToolCallingResult)
    assert "AcmeCommerce" in result.answer
    assert len(result.tools_executed) == 0

