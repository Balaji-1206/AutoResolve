"""
FastAPI Router for Operational Investigation Tools.

Endpoints:
- GET /api/v1/tools/orders/{order_id}: Fetches ground-truth order data for investigation.
- GET /api/v1/tools/customers/{customer_id}: Fetches customer profile and account status.
- GET /api/v1/tools/payments/{payment_id}: Fetches payment transaction and status.
- GET /api/v1/tools/refunds/{refund_id}: Fetches refund claim and processing status.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.models.tool import (
    CustomerResponse,
    ErrorResponse,
    OrderResponse,
    PaymentResponse,
    RefundResponse,
    ToolQueryRequest,
    RefundExecutionRequest,
    RefundExecutionResponse,
    OrderStatusUpdateRequest,
    ShippingLabelRequest,
    ShippingLabelResponse,
)
from app.tools.actions import (
    execute_refund_action,
    update_order_status_action,
    generate_shipping_label_action,
)
from app.tools.agent import QwenToolAgent, ToolCallingResult
from app.tools.customer import CustomerNotFoundError, get_customer
from app.tools.orders import OrderNotFoundError, get_order, list_orders
from app.tools.payments import PaymentNotFoundError, get_payment
from app.tools.refunds import RefundNotFoundError, get_refund

router = APIRouter(prefix="/tools", tags=["Operational Tools"])


@router.get(
    "/orders",
    response_model=List[OrderResponse],
    summary="List Orders",
    description="Fetches live operational orders, optionally filtered by customer_id.",
)
async def get_orders(customer_id: Optional[str] = None) -> List[OrderResponse]:
    """HTTP handler querying list of orders from operational data store."""
    try:
        return list_orders(customer_id)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal tool error: {str(err)}",
        )


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


# =============================================================================
# Action Execution Endpoints (Phase 2 Mutation APIs)
# =============================================================================

@router.post(
    "/refunds/execute",
    response_model=RefundExecutionResponse,
    summary="Execute Authoritative Refund",
    description="Processes a payment gateway refund and records transaction details in SQLite.",
)
async def execute_refund(request: RefundExecutionRequest) -> RefundExecutionResponse:
    """HTTP handler executing authoritative refund and updating database state."""
    try:
        return execute_refund_action(
            order_id=request.order_id,
            customer_id=request.customer_id,
            amount=request.amount,
            reason=request.reason,
            refund_id=request.refund_id,
            payment_method=request.payment_method or "ORIGINAL_PAYMENT_METHOD",
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except OrderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refund execution failed: {str(err)}",
        )


@router.post(
    "/orders/{order_id}/update-status",
    response_model=OrderResponse,
    summary="Update Order Lifecycle Status",
    description="Mutates order status (e.g. RETURN_INITIATED, REFUNDED) in operational database.",
)
async def update_order_status(
    order_id: str,
    request: OrderStatusUpdateRequest,
) -> OrderResponse:
    """HTTP handler updating order status."""
    try:
        return update_order_status_action(
            order_id=order_id,
            new_status=request.status,
            reason=request.reason,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except OrderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order status update failed: {str(err)}",
        )


@router.post(
    "/shipping/generate-label",
    response_model=ShippingLabelResponse,
    summary="Generate Prepaid Return Shipping Label",
    description="Allocates carrier tracking number and creates shipment voucher in SQLite.",
)
async def generate_shipping_label(request: ShippingLabelRequest) -> ShippingLabelResponse:
    """HTTP handler generating return shipping label."""
    try:
        return generate_shipping_label_action(
            order_id=request.order_id,
            customer_id=request.customer_id,
            carrier=request.carrier,
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Shipping label generation failed: {str(err)}",
        )



