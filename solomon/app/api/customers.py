"""app/api/customers.py - Customer management"""
from flask import Blueprint, request, jsonify
from app.services.auth_service import jwt_required
from app.models import Customer
from app.extensions import db

customers_bp = Blueprint("customers", __name__)


@customers_bp.route("", methods=["GET"])
@jwt_required
def list_customers():
    query = Customer.query
    interest = request.args.get("interest")
    if interest:
        query = query.filter(Customer.interest == interest)
    customers = query.order_by(Customer.lifetime_value.desc()).limit(100).all()
    return jsonify({"items": [c.to_dict() for c in customers]})


@customers_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required
def get_customer(customer_id):
    c = Customer.query.get_or_404(customer_id)
    return jsonify(c.to_dict())


@customers_bp.route("", methods=["POST"])
@jwt_required
def create_customer():
    data = request.json or {}
    if "name" not in data:
        return jsonify({"error": "name required"}), 400
    c = Customer(
        name=data["name"],
        email=data.get("email"),
        phone=data.get("phone"),
        company=data.get("company"),
        country=data.get("country"),
        interest=data.get("interest"),
        notes=data.get("notes"),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201
