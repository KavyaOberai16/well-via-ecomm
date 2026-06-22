"""Hardcoded plain-text notification templates.

Each function returns either:
  - (subject, body) for an email
  - body for an SMS

Variables come straight off the Order/User objects — no template-engine
runtime, no surprises. If you want to localize or add HTML emails later,
swap out the renderer and keep the function signatures.
"""
from __future__ import annotations

from app.models.order import Order


def _customer_name(order: Order) -> str:
    if order.user and order.user.full_name:
        return order.user.full_name.split(" ")[0]  # first name only
    return "there"


def _money(order: Order, value) -> str:
    # Lean on the order's currency for display. Decimal(value) -> str so we
    # don't accidentally emit "0E-2" or scientific notation.
    return f"{order.currency} {float(value):.2f}"


def _items_block(order: Order) -> str:
    if not order.items:
        return ""
    lines = []
    for item in order.items:
        lines.append(
            f"  • {item.quantity}× #{item.product_id} @ {_money(order, item.unit_price)}"
        )
    return "\n".join(lines)


# ---- PAID ----


def email_order_paid(order: Order) -> tuple[str, str]:
    subject = f"Order #{order.id} confirmed — thanks for shopping with us"
    body = f"""Hi {_customer_name(order)},

Thanks for your order! We've received your payment and are getting it ready.

ORDER #{order.id}
---------------------------
{_items_block(order)}

Subtotal:  {_money(order, order.subtotal)}
Tax:       {_money(order, order.tax_amount)}
Discount:  -{_money(order, order.discount_amount)}
Total:     {_money(order, order.total_amount)}

Shipping to:
{order.shipping_address or 'No address on file'}

We'll email you again with tracking once it ships.
"""
    return subject, body


def sms_order_paid(order: Order) -> str:
    return (
        f"Order #{order.id} confirmed. {_money(order, order.total_amount)} "
        "paid. We'll text you when it ships."
    )


# ---- SHIPPED ----


def email_order_shipped(order: Order) -> tuple[str, str]:
    subject = f"Your order #{order.id} is on its way"
    tracking_block = ""
    if order.tracking_number or order.carrier:
        tracking_block = "\n".join(
            line for line in [
                f"Carrier: {order.carrier}" if order.carrier else None,
                f"Tracking: {order.tracking_number}" if order.tracking_number else None,
            ] if line
        )
        tracking_block = f"\n{tracking_block}\n"

    body = f"""Hi {_customer_name(order)},

Great news — your order #{order.id} has shipped.
{tracking_block}
Shipping to:
{order.shipping_address or 'No address on file'}

You'll get another email once it's delivered.
"""
    return subject, body


def sms_order_shipped(order: Order) -> str:
    parts = [f"Order #{order.id} shipped"]
    if order.carrier:
        parts.append(f"via {order.carrier}")
    if order.tracking_number:
        parts.append(f"#{order.tracking_number}")
    return " ".join(parts) + "."


# ---- DELIVERED ----


def email_order_delivered(order: Order) -> tuple[str, str]:
    subject = f"Your order #{order.id} has arrived"
    body = f"""Hi {_customer_name(order)},

Your order #{order.id} was just marked delivered. We hope you love it!

If anything's wrong, just reply to this email and we'll make it right.

Loved it? You can review the items from your orders page.
"""
    return subject, body


# ---- CANCELLED ----


def email_order_cancelled(order: Order) -> tuple[str, str]:
    subject = f"Order #{order.id} cancelled"
    reason = (order.refund_reason or "Cancelled by the store").strip()
    body = f"""Hi {_customer_name(order)},

Your order #{order.id} has been cancelled.

Reason: {reason}

Any payment will be returned to your original payment method within a few
business days. If you have questions, just reply to this email.
"""
    return subject, body


# ---- REFUNDED ----


def email_order_refunded(order: Order) -> tuple[str, str]:
    subject = f"Order #{order.id} refunded"
    reason = (order.refund_reason or "Refunded by the store").strip()
    body = f"""Hi {_customer_name(order)},

A refund of {_money(order, order.total_amount)} has been issued for order
#{order.id}.

Reason: {reason}

The amount should appear on your statement within a few business days.
"""
    return subject, body
