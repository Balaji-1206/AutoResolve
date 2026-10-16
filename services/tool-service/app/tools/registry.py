"""
Tool Calling Definition Registry.

Provides JSON Schemas for AcmeCommerce operational tools compliant with OpenAI & Ollama function calling specifications.
"""

from typing import Any, Dict, List

TOOL_NAMES = [
    "get_order",
    "get_customer",
    "get_payment",
    "get_refund",
]

_TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_order",
            "description": "Retrieve ground-truth order information including status (e.g. DELIVERED, SHIPPED, PROCESSING, CANCELLED), items, total amount, shipping status, and delivery date by order ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The unique order ID in format ORD-XXXX (e.g., 'ORD-1001', 'ORD-0001').",
                    }
                },
                "required": ["order_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer",
            "description": "Retrieve customer profile, verified account status, email, phone number last 4 digits, and billing zip code by customer ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "The unique customer ID in format CUS-XXXX (e.g., 'CUS-1001').",
                    }
                },
                "required": ["customer_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_payment",
            "description": "Retrieve payment transaction details including amount, payment method (CREDIT_CARD, DIGITAL_WALLET), execution timestamp, and status (SUCCESS, FAILED) by payment ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "payment_id": {
                        "type": "string",
                        "description": "The unique payment ID in format PAY-XXXX (e.g., 'PAY-1001').",
                    }
                },
                "required": ["payment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_refund",
            "description": "Retrieve refund status (COMPLETED, PENDING, REJECTED), reason, requested timestamp, and settlement timestamp by refund ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "refund_id": {
                        "type": "string",
                        "description": "The unique refund ID in format REF-XXXX (e.g., 'REF-1001').",
                    }
                },
                "required": ["refund_id"],
            },
        },
    },
]


def get_tool_definitions() -> List[Dict[str, Any]]:
    """
    Returns the complete list of operational tool definitions for LLM tool calling.
    """
    return _TOOL_DEFINITIONS
