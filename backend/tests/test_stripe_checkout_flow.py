import asyncio

import pytest

from payment_routes import handle_stripe_event
from shop_routes import is_active_admin_order


class FakeOrder:
    def __init__(self, order_id="ord_123", payment_status="pending", order_status="processing"):
        self.id = order_id
        self.payment_status = payment_status
        self.order_status = order_status
        self.stripe_session_id = None
        self.paid_at = None
        self.invoice_number = None
        self.invoice_url = None
        self.invoice_created_at = None
        self.created_at = "2026-01-01T00:00:00+00:00"


class FakeSession:
    def __init__(self, order):
        self.order = order
        self.commits = 0

    async def get(self, model, order_id):
        if self.order and self.order.id == order_id:
            return self.order
        return None

    async def execute(self, query):
        class Result:
            def scalars(self):
                return self

            def all(self):
                return []

        return Result()

    async def commit(self):
        self.commits += 1


@pytest.mark.asyncio
async def test_completed_checkout_marks_paid_and_generates_invoice_once(monkeypatch):
    order = FakeOrder()
    session = FakeSession(order)

    async def fake_upload(*args, **kwargs):
        return "https://cdn.example/invoice-1.pdf"

    monkeypatch.setattr("payment_routes.generate_invoice_pdf", lambda *args, **kwargs: b"pdf-bytes")
    monkeypatch.setattr("payment_routes.upload_invoice_pdf", fake_upload)

    event = {
        "type": "checkout.session.completed",
        "data": {"object": {"id": "cs_test_123", "payment_status": "paid", "metadata": {"order_id": "ord_123"}}},
    }

    first = await handle_stripe_event(event, session)
    second = await handle_stripe_event(event, session)

    assert first["updated"] is True
    assert second["updated"] is False
    assert order.payment_status == "paid"
    assert order.order_status == "processing"
    assert order.stripe_session_id == "cs_test_123"
    assert order.invoice_number is not None
    assert order.invoice_url == "https://cdn.example/invoice-1.pdf"
    assert session.commits == 1


@pytest.mark.asyncio
async def test_expired_checkout_marks_cancelled():
    order = FakeOrder()
    session = FakeSession(order)

    event = {
        "type": "checkout.session.expired",
        "data": {"object": {"id": "cs_test_456", "metadata": {"order_id": "ord_123"}}},
    }

    result = await handle_stripe_event(event, session)

    assert result["updated"] is True
    assert order.payment_status == "cancelled"
    assert order.order_status == "cancelled"
    assert order.invoice_url is None


@pytest.mark.asyncio
async def test_missing_order_metadata_is_ignored():
    session = FakeSession(None)
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {"id": "cs_test_789", "payment_status": "paid", "metadata": {}}},
    }

    result = await handle_stripe_event(event, session)

    assert result["updated"] is False
    assert result["reason"] == "missing_order_id"


def test_active_admin_orders_only_include_paid_orders():
    assert is_active_admin_order(FakeOrder(payment_status="paid")) is True
    assert is_active_admin_order(FakeOrder(payment_status="pending")) is False
    assert is_active_admin_order(FakeOrder(payment_status="cancelled")) is False
    assert is_active_admin_order(FakeOrder(payment_status="failed")) is False
