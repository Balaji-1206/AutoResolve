"""
Unit Tests for get_customer() Tool in Tool Service.
"""

import pytest
from app.tools.customer import get_customer, CustomerNotFoundError


def test_get_existing_customer():
    """Verify an existing customer is retrieved with correct fields."""
    customer = get_customer("CUS-1001")
    assert customer is not None
    assert customer.customer_id == "CUS-1001"
    assert customer.name == "Aarav Kumar"
    assert customer.email == "aarav.kumar@example.com"
    assert customer.account_status == "ACTIVE"
    assert customer.billing_zip == "77001"
    assert customer.phone_last4 == "1409"
    assert customer.created_at == "2024-10-31T00:00:00Z"


def test_get_customer_case_and_whitespace_insensitivity():
    """Verify customer ID lookup handles casing and whitespace gracefully."""
    customer = get_customer("  cus-1001  ")
    assert customer.customer_id == "CUS-1001"
    assert customer.name == "Aarav Kumar"


def test_get_nonexistent_customer():
    """Verify querying a non-existent customer raises CustomerNotFoundError."""
    with pytest.raises(CustomerNotFoundError) as exc_info:
        get_customer("CUS-9999")
    assert "CUS-9999" in str(exc_info.value)


def test_get_customer_invalid_format():
    """Verify invalid customer ID formats raise ValueError."""
    with pytest.raises(ValueError) as exc_info:
        get_customer("INVALID-ID")
    assert "Invalid customer ID format" in str(exc_info.value)
