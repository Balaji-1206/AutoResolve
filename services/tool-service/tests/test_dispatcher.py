"""
Unit Tests for Tool Dispatcher Layer.
"""

from app.tools.dispatcher import ToolDispatcher


def test_dispatch_get_order():
    """Verify tool dispatcher correctly executes get_order."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("get_order", {"order_id": "ORD-1001"})
    assert result["success"] is True
    assert result["data"]["order_id"] == "ORD-1001"
    assert result["data"]["status"] == "DELIVERED"


def test_dispatch_get_customer():
    """Verify tool dispatcher correctly executes get_customer."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("get_customer", {"customer_id": "CUS-1001"})
    assert result["success"] is True
    assert result["data"]["customer_id"] == "CUS-1001"
    assert result["data"]["name"] == "Aarav Kumar"


def test_dispatch_get_payment():
    """Verify tool dispatcher correctly executes get_payment."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("get_payment", {"payment_id": "PAY-1001"})
    assert result["success"] is True
    assert result["data"]["payment_id"] == "PAY-1001"
    assert result["data"]["status"] == "SUCCESS"


def test_dispatch_get_refund():
    """Verify tool dispatcher correctly executes get_refund."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("get_refund", {"refund_id": "REF-1001"})
    assert result["success"] is True
    assert result["data"]["refund_id"] == "REF-1001"
    assert result["data"]["status"] == "COMPLETED"


def test_dispatch_unknown_tool():
    """Verify tool dispatcher gracefully handles unknown tool names."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("unknown_tool", {})
    assert result["success"] is False
    assert "Unknown tool" in result["error"]


def test_dispatch_not_found_handling():
    """Verify tool dispatcher captures not-found exceptions and returns structured error."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("get_order", {"order_id": "ORD-9999"})
    assert result["success"] is False
    assert "not found" in result["error"].lower()


def test_dispatch_invalid_format_handling():
    """Verify tool dispatcher captures validation errors cleanly."""
    dispatcher = ToolDispatcher()
    result = dispatcher.dispatch("get_order", {"order_id": "INVALID"})
    assert result["success"] is False
    assert "invalid" in result["error"].lower()
