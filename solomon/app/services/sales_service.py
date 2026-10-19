"""
app/services/sales_service.py - Sales pipeline
"""
import secrets
import string
import logging
from datetime import datetime
from typing import Dict, Any

from app.models import Sale, Treasure, Customer
from app.extensions import db

log = logging.getLogger(__name__)


def _gen_invoice() -> str:
    """Generate invoice number: INV-YYYYMM-XXXXXX"""
    now = datetime.utcnow()
    suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"INV-{now.year}{now.month:02d}-{suffix}"


def create_sale(treasure_id: str, customer_id: int, sold_price: float,
                payment_method: str = "crypto", commission_rate: float = 0.10,
                notes: str = None) -> Sale:
    """Create a new sale and calculate financials."""
    treasure = Treasure.query.get(treasure_id)
    if not treasure:
        raise ValueError(f"Treasure {treasure_id} not found")

    customer = Customer.query.get(customer_id)
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    cost = treasure.price
    commission = sold_price * commission_rate
    fee = sold_price * 0.05  # 5% platform fee
    profit = sold_price - cost - commission - fee

    sale = Sale(
        invoice_number=_gen_invoice(),
        treasure_id=treasure_id,
        customer_id=customer_id,
        sold_price=round(sold_price, 2),
        cost_basis=round(cost, 2),
        commission_rate=commission_rate,
        commission_amount=round(commission, 2),
        platform_fee=round(fee, 2),
        net_profit=round(profit, 2),
        status="pending",
        payment_method=payment_method,
        notes=notes,
        sold_at=datetime.utcnow(),
    )
    db.session.add(sale)
    db.session.commit()

    # Update customer LTV
    customer.lifetime_value = (customer.lifetime_value or 0) + sold_price
    customer.last_purchase_at = datetime.utcnow()
    db.session.commit()

    log.info(f"Sale created: {sale.invoice_number} ${sold_price}")
    return sale


def update_sale_status(sale_id: int, new_status: str) -> Sale:
    """Update sale status with timestamp."""
    sale = Sale.query.get(sale_id)
    if not sale:
        raise ValueError(f"Sale {sale_id} not found")

    sale.status = new_status
    now = datetime.utcnow()
    if new_status == "paid":
        sale.paid_at = now
    elif new_status == "shipped":
        sale.shipped_at = now
    elif new_status == "delivered":
        sale.delivered_at = now
    elif new_status == "refunded":
        sale.refunded_at = now

    db.session.commit()
    return sale
