"""
FastAPI Router for Operational Investigation Tools.

Endpoints:
- GET /api/v1/tools/orders/{order_id}: Fetches ground-truth order data for investigation.
- GET /api/v1/tools/customers/{customer_id}: Fetches customer profile and account status.
- GET /api/v1/tools/payments/{payment_id}: Fetches payment transaction and status.
- GET /api/v1/tools/refunds/{refund_id}: Fetches refund claim and processing status.
"""

from fastapi import APIRouter, HTTPException, status
from app.models.tool import (
    CustomerResponse,
    ErrorResponse,
    OrderResponse,
    PaymentResponse,
    RefundResponse,
    ToolQueryRequest,
)
from app.tools.agent import QwenToolAgent, ToolCallingResult
from app.tools.customer import CustomerNotFoundError, get_customer
from app.tools.orders import OrderNotFoundError, get_order
from app.tools.payments import PaymentNotFoundError, get_payment
from app.tools.refunds import RefundNotFoundError, get_refund

router = APIRouter(prefix="/tools", tags=["Operational Tools"])



@router.get(
    "/orders/{order_id}",
    response_model=OrderResponse,
    responses={
        status.HTTP_200_OK: {"description": "Order details successfully retrieved"},
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse, "description": "Invalid order identifier format"},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Order not found"},
    },
    summary="Get Order by ID",
    description="Fetches live operational order details including status, dates, amounts, and refund eligibility.",
)
async def get_order_by_id(order_id: str) -> OrderResponse:
    """HTTP handler querying order state from operational data store."""
    try:
        return get_order(order_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except OrderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal tool error: {str(err)}",
        )


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerResponse,
    responses={
        status.HTTP_200_OK: {"description": "Customer profile successfully retrieved"},
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse, "description": "Invalid customer identifier format"},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Customer not found"},
    },
    summary="Get Customer by ID",
    description="Fetches customer identity, email, account standing, and contact verification data.",
)
async def get_customer_by_id(customer_id: str) -> CustomerResponse:
    """HTTP handler querying customer profile from operational data store."""
    try:
        return get_customer(customer_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except CustomerNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal tool error: {str(err)}",
        )


@router.get(
    "/payments/{payment_id}",
    response_model=PaymentResponse,
    responses={
        status.HTTP_200_OK: {"description": "Payment record successfully retrieved"},
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse, "description": "Invalid payment identifier format"},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Payment not found"},
    },
    summary="Get Payment by ID",
    description="Fetches payment execution details, method, transaction status, and failure explanations.",
)
async def get_payment_by_id(payment_id: str) -> PaymentResponse:
    """HTTP handler querying payment details from operational data store."""
    try:
        return get_payment(payment_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except PaymentNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal tool error: {str(err)}",
        )


@router.get(
    "/refunds/{refund_id}",
    response_model=RefundResponse,
    responses={
        status.HTTP_200_OK: {"description": "Refund record successfully retrieved"},
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse, "description": "Invalid refund identifier format"},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse, "description": "Refund not found"},
    },
    summary="Get Refund by ID",
    description="Fetches refund progress, approval logs, reason codes, and processing status.",
)
async def get_refund_by_id(refund_id: str) -> RefundResponse:
    """HTTP handler querying refund records from operational data store."""
    try:
        return get_refund(refund_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except RefundNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal tool error: {str(err)}",
        )


@router.post(
    "/query",
    response_model=ToolCallingResult,
    summary="Tool-Calling Autonomous Resolution with Qwen3",
    description="Submits customer inquiry to Qwen3 with tool execution capabilities. Qwen3 autonomously selects and invokes operational tools (orders, customer, payment, refund) and generates a grounded response.",
)
async def query_tools(request: ToolQueryRequest) -> ToolCallingResult:
    """
    Submits user query to Qwen3 tool calling agent, automatically executing
    requested operational tools and synthesizing a grounded answer.
    """
    try:
        agent = QwenToolAgent()
        return await agent.run_async(request.query)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tool calling execution failed: {str(err)}",
        )


