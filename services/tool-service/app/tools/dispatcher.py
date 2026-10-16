"""
Tool Execution Dispatcher.

Receives structured tool call requests (name & arguments), executes the corresponding
Python operational tool, and serializes the output or captured error.
"""

import json
from typing import Any, Dict
from app.tools.customer import CustomerNotFoundError, get_customer
from app.tools.orders import OrderNotFoundError, get_order
from app.tools.payments import PaymentNotFoundError, get_payment
from app.tools.refunds import RefundNotFoundError, get_refund


class ToolDispatcher:
    """
    Executes operational tools requested by an agent or LLM.
    """

    def __init__(self):
        self._handlers = {
            "get_order": self._handle_get_order,
            "get_customer": self._handle_get_customer,
            "get_payment": self._handle_get_payment,
            "get_refund": self._handle_get_refund,
        }

    def _handle_get_order(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        order_id = arguments.get("order_id", "")
        result = get_order(order_id)
        return result.model_dump()

    def _handle_get_customer(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        customer_id = arguments.get("customer_id", "")
        result = get_customer(customer_id)
        return result.model_dump()

    def _handle_get_payment(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        payment_id = arguments.get("payment_id", "")
        result = get_payment(payment_id)
        return result.model_dump()

    def _handle_get_refund(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        refund_id = arguments.get("refund_id", "")
        result = get_refund(refund_id)
        return result.model_dump()

    def dispatch(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a named tool with supplied arguments.

        Args:
            tool_name: Function name emitted by LLM (e.g. 'get_order')
            arguments: Dict of keyword arguments (e.g. {'order_id': 'ORD-1001'})

        Returns:
            Dict containing 'success', 'tool_name', and either 'data' or 'error'.
        """
        handler = self._handlers.get(tool_name)
        if not handler:
            return {
                "success": False,
                "tool_name": tool_name,
                "error": f"Unknown tool: '{tool_name}'. Available tools: {list(self._handlers.keys())}",
            }

        try:
            data = handler(arguments)
            return {
                "success": True,
                "tool_name": tool_name,
                "data": data,
            }
        except (
            ValueError,
            OrderNotFoundError,
            CustomerNotFoundError,
            PaymentNotFoundError,
            RefundNotFoundError,
        ) as err:
            return {
                "success": False,
                "tool_name": tool_name,
                "error": str(err),
            }
        except Exception as err:
            return {
                "success": False,
                "tool_name": tool_name,
                "error": f"Tool execution failed: {str(err)}",
            }
