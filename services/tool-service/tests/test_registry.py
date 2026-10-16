"""
Unit Tests for Tool Calling Definition Registry.
"""

from app.tools.registry import get_tool_definitions, TOOL_NAMES


def test_registry_contains_all_tools():
    """Verify registry exports definitions for all 4 operational tools."""
    tools = get_tool_definitions()
    assert len(tools) == 4
    tool_names = [t["function"]["name"] for t in tools]
    assert "get_order" in tool_names
    assert "get_customer" in tool_names
    assert "get_payment" in tool_names
    assert "get_refund" in tool_names
    assert set(tool_names) == set(TOOL_NAMES)


def test_registry_schema_compliance():
    """Verify each tool definition adheres to OpenAI/Ollama function calling schema."""
    tools = get_tool_definitions()
    for tool in tools:
        assert tool["type"] == "function"
        fn = tool["function"]
        assert "name" in fn and isinstance(fn["name"], str)
        assert "description" in fn and len(fn["description"]) > 10
        params = fn["parameters"]
        assert params["type"] == "object"
        assert "properties" in params
        assert "required" in params
        assert len(params["required"]) >= 1
