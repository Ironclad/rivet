"""app/api/export.py - Data export (CSV/Excel)"""
from io import BytesIO, StringIO
import csv
from flask import Blueprint, Response, request
from app.services.auth_service import jwt_required
from app.models import Sale, Treasure, Customer

export_bp = Blueprint("export", __name__)


@export_bp.route("/sales.csv", methods=["GET"])
@jwt_required
def sales_csv():
    sales = Sale.query.order_by(Sale.sold_at.desc()).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "invoice", "treasure", "customer", "amount", "status", "payment", "sold_at"])
    for s in sales:
        writer.writerow([
            s.id, s.invoice_number,
            s.treasure.title if s.treasure else "",
            s.customer.name if s.customer else "",
            s.sold_price, s.status, s.payment_method,
            s.sold_at.isoformat() if s.sold_at else "",
        ])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales.csv"},
    )


@export_bp.route("/sales.xlsx", methods=["GET"])
@jwt_required
def sales_xlsx():
    try:
        import openpyxl
    except ImportError:
        return {"error": "openpyxl not installed"}, 501

    sales = Sale.query.order_by(Sale.sold_at.desc()).all()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sales"
    ws.append(["ID", "Invoice", "Treasure", "Customer", "Amount", "Status", "Payment", "Date"])
    for s in sales:
        ws.append([
            s.id, s.invoice_number,
            s.treasure.title if s.treasure else "",
            s.customer.name if s.customer else "",
            s.sold_price, s.status, s.payment_method,
            s.sold_at.isoformat() if s.sold_at else "",
        ])

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        buf.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=sales.xlsx"},
    )


@export_bp.route("/treasures.csv", methods=["GET"])
@jwt_required
def treasures_csv():
    treasures = Treasure.query.all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "category", "price", "estimated_value", "profit_pct", "status"])
    for t in treasures:
        writer.writerow([t.id, t.title, t.category, t.price, t.estimated_value, t.profit_pct, t.status])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=treasures.csv"},
    )
