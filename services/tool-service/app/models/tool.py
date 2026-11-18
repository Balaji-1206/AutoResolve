"""
Tool Service Pydantic Data Models.

Defines response structures for customer, order, payment, and refund investigation tools.
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class OrderResponse(BaseModel):
    """
    Structured representation of an order returned by the get_order tool.
    """
    model_config = ConfigDict(populate_by_name=True)

    order_id: str = Field(..., description="Unique Order Identifier (e.g. ORD-1001)")
    customer_id: str = Field(..., description="Customer Identifier associated with order")
    status: str = Field(..., description="Order lifecycle status (DELIVERED, SHIPPED, PROCESSING, CANCELLED)")
    total_amount: float = Field(..., description="Total purchase amount", alias="total_amount")
    currency: str = Field(default="USD", description="Currency code (e.g. USD)")
    order_date: str = Field(..., description="Timestamp or date when order was placed")
    delivery_date: Optional[str] = Field(default=None, description="Timestamp or date of delivery if completed")
    shipping_status: Optional[str] = Field(default=None, description="Detailed transit status")
    product_category: Optional[str] = Field(default=None, description="Primary category of items purchased")
    payment_id: Optional[str] = Field(default=None, description="Associated payment transaction ID")
    refundable: Optional[bool] = Field(default=None, description="Policy flag indicating if order qualifies for return")


class CustomerResponse(BaseModel):
    """
    Structured representation of a customer profile.
    """
    model_config = ConfigDict(populate_by_name=True)

    customer_id: str = Field(..., description="Unique Customer Identifier (e.g. CUS-1001)")
    name: str = Field(..., description="Customer full name")
    email: str = Field(..., description="Customer email address")
    account_status: str = Field(..., description="Account lifecycle status (ACTIVE, SUSPENDED, DEACTIVATED)")
    billing_zip: str = Field(..., description="Primary billing postal code")
    phone_last4: str = Field(..., description="Last 4 digits of phone number")
    created_at: str = Field(..., description="Customer registration timestamp")


class PaymentResponse(BaseModel):
    """
    Structured representation of a payment transaction.
    """
    model_config = ConfigDict(populate_by_name=True)

    payment_id: str = Field(..., description="Unique Payment Transaction Identifier (e.g. PAY-1001)")
    order_id: str = Field(..., description="Associated Order ID")
    customer_id: str = Field(..., description="Associated Customer ID")
    amount: float = Field(..., description="Transaction amount")
    status: str = Field(..., description="Payment status (SUCCESS, FAILED, PENDING)")
    payment_method_type: str = Field(..., description="Method used (CREDIT_CARD, DIGITAL_WALLET, BANK_TRANSFER)")
    failure_reason: Optional[str] = Field(default=None, description="Detailed failure message if payment failed")
    created_at: str = Field(..., description="Payment execution timestamp")


class RefundResponse(BaseModel):
    """
    Structured representation of a refund claim or transaction.
    """
    model_config = ConfigDict(populate_by_name=True)

    refund_id: str = Field(..., description="Unique Refund Identifier (e.g. REF-1001)")
    order_id: str = Field(..., description="Associated Order ID")
    customer_id: str = Field(..., description="Associated Customer ID")
    amount: float = Field(..., description="Refunded amount")
    status: str = Field(..., description="Refund processing status (COMPLETED, PENDING, REJECTED)")
    reason: str = Field(..., description="Categorized business reason for refund")
    requested_at: str = Field(..., description="Timestamp when refund was initiated")
    approved_at: Optional[str] = Field(default=None, description="Timestamp of managerial approval")
    processed_at: Optional[str] = Field(default=None, description="Timestamp of payment gateway settlement")


class ErrorResponse(BaseModel):
    """
    Standardized error response structure.
    """
    detail: str = Field(..., description="Human-readable explanation of error")


class ToolQueryRequest(BaseModel):
    """
    Request payload for end-to-end tool calling with Qwen3.
    """
    query: str = Field(..., description="Customer operational inquiry", min_length=2)


# =============================================================================
# Action Execution Models (Phase 2 Automated Mutation)
# =============================================================================

class RefundExecutionRequest(BaseModel):
    """Payload to trigger an authoritative automated refund execution."""
    model_config = ConfigDict(populate_by_name=True)

    order_id: str = Field(..., description="Unique Order Identifier (e.g. ORD-1001)")
    customer_id: str = Field(..., description="Associated Customer Identifier (e.g. CUS-1001)")
    amount: float = Field(..., gt=0.0, description="Refund monetary amount")
    reason: str = Field(..., description="Business or policy reason for refund execution")
    refund_id: Optional[str] = Field(default=None, description="Optional pre-allocated refund ID")
    payment_method: Optional[str] = Field(default="ORIGINAL_PAYMENT_METHOD", description="Destination payment method")


class RefundExecutionResponse(BaseModel):
    """Output confirming gateway refund execution and database persistence."""
    model_config = ConfigDict(populate_by_name=True)

    refund_id: str
    order_id: str
    customer_id: str
    amount: float
    status: str = Field(default="PROCESSED")
    gateway_transaction_id: str
    processed_at: str
    message: str


class OrderStatusUpdateRequest(BaseModel):
    """Payload to update lifecycle status of an operational order."""
    model_config = ConfigDict(populate_by_name=True)

    status: str = Field(..., description="New lifecycle status (e.g. RETURN_INITIATED, REFUNDED)")
    reason: Optional[str] = Field(default=None, description="Operational explanation for update")


class ShippingLabelRequest(BaseModel):
    """Payload to generate an official prepaid return shipping label."""
    model_config = ConfigDict(populate_by_name=True)

    order_id: str = Field(..., description="Unique Order Identifier")
    customer_id: str = Field(..., description="Unique Customer Identifier")
    carrier: str = Field(default="UPS Ground", description="Shipping carrier service name")


class ShippingLabelResponse(BaseModel):
    """Output containing return shipping label voucher details and tracking number."""
    model_config = ConfigDict(populate_by_name=True)

    shipment_id: str
    order_id: str
    customer_id: str
    carrier: str
    tracking_number: str
    status: str = Field(default="LABEL_CREATED")
    label_url: str
    created_at: str



