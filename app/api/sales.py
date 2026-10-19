"""app/api/sales.py - Sales pipeline"""
from flask import Blueprint, request, jsonify
from app.services.auth_service import jwt_required
from app.models import Sale
from app.extensions import db
from app.services.sales_service import create_sale, update_sale_status

sales_bp = Blueprint("sales", __name__)


@sales_bp.route("", methods=["GET"])
@jwt_required
def list_sales():
    query = Sale.query
    status = request.args.get("status")
    if status:
        query = query.filter(Sale.status == status)
    sales = query.order_by(Sale.sold_at.desc()).limit(100).all()
    return jsonify({"items": [s.to_dict() for s in sales]})


@sales_bp.route("/<int:sale_id>", methods=["GET"])
@jwt_required
def get_sale(sale_id):
    s = Sale.query.get_or_404(sale_id)
    return jsonify(s.to_dict())


@sales_bp.route("", methods=["POST"])
@jwt_required
def create_sale_endpoint():
    data = request.json or {}
    required = ["treasure_id", "customer_id", "sold_price"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"Missing field: {f}"}), 400
    try:
        sale = create_sale(
            treasure_id=data["treasure_id"],
            customer_id=int(data["customer_id"]),
            sold_price=float(data["sold_price"]),
            payment_method=data.get("payment_method", "crypto"),
            commission_rate=float(data.get("commission_rate", 0.10)),
            notes=data.get("notes"),
        )
        return jsonify(sale.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@sales_bp.route("/<int:sale_id>/status", methods=["PATCH"])
@jwt_required
def update_status(sale_id):
    data = request.json or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "status required"}), 400
    valid = ["pending", "invoiced", "paid", "shipped", "delivered", "refunded", "cancelled"]
    if new_status not in valid:
        return jsonify({"error": f"Invalid status. Must be one of: {valid}"}), 400
    try:
        sale = update_sale_status(sale_id, new_status)
        return jsonify(sale.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@sales_bp.route("/<int:sale_id>/invoice", methods=["GET"])
@jwt_required
def get_invoice(sale_id):
    s = Sale.query.get_or_404(sale_id)
    return jsonify({
        "invoice_number": s.invoice_number,
        "issued_at": s.sold_at.isoformat(),
        "seller": {"name": "Solomon LLC", "address": "123 Treasure Way, Internet"},
        "buyer": s.customer.to_dict() if s.customer else None,
        "items": [{
            "description": s.treasure.title if s.treasure else "Item",
            "quantity": 1,
            "unit_price": s.sold_price,
            "total": s.sold_price,
        }],
        "subtotal": s.sold_price,
        "commission": s.commission_amount,
        "platform_fee": s.platform_fee,
        "total": s.sold_price,
        "currency": "USD",
        "payment_method": s.payment_method,
        "status": s.status,
    })
