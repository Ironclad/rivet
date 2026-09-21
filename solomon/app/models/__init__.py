"""
app/models/__init__.py - SQLAlchemy models
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

from app.extensions import db


# ============ User ============
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user", index=True)  # user|admin|manager
    active = db.Column(db.Boolean, default=True)
    api_key = db.Column(db.String(64), unique=True, nullable=True, index=True)

    # 2FA / Security (v4.0)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(32), nullable=True)
    failed_login_count = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password: str):
        """Hash and set password using bcrypt-style (werkzeug)."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def generate_api_key(self):
        self.api_key = secrets.token_hex(32)
        return self.api_key

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "active": self.active,
            "two_factor_enabled": self.two_factor_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


# ============ Treasure ============
class Treasure(db.Model):
    __tablename__ = "treasures"

    id = db.Column(db.String(40), primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), index=True)  # electronics, vehicles, medical, etc.
    condition = db.Column(db.String(20), default="used")  # new|used|refurbished
    source = db.Column(db.String(50), index=True)  # govdeals, crypto, etc.
    source_url = db.Column(db.String(500), nullable=True)
    location = db.Column(db.String(120), nullable=True)

    # Pricing
    price = db.Column(db.Float, nullable=False)  # asking price
    estimated_value = db.Column(db.Float, nullable=True)  # ML estimate
    profit_pct = db.Column(db.Float, default=0.0, index=True)  # (est - price) / price

    # Status
    status = db.Column(db.String(20), default="pending", index=True)  # pending|analyzed|listed|sold|archived
    risk_score = db.Column(db.Float, default=0.5)  # 0-1, higher = riskier

    # ML features
    features = db.Column(db.Text, nullable=True)  # JSON blob
    ml_confidence = db.Column(db.Float, default=0.0)

    # Timestamps
    discovered_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sales = db.relationship("Sale", backref="treasure", lazy="dynamic")
    alerts = db.relationship("Alert", backref="treasure", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_description=True):
        d = {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "condition": self.condition,
            "source": self.source,
            "location": self.location,
            "price": self.price,
            "estimated_value": self.estimated_value,
            "profit_pct": round(self.profit_pct, 2) if self.profit_pct else 0,
            "status": self.status,
            "risk_score": round(self.risk_score, 3) if self.risk_score else 0,
            "ml_confidence": round(self.ml_confidence, 3) if self.ml_confidence else 0,
            "discovered_at": self.discovered_at.isoformat() if self.discovered_at else None,
            "source_url": self.source_url,
        }
        if include_description:
            d["description"] = self.description
        return d

    def __repr__(self):
        return f"<Treasure {self.id}: {self.title[:30]}>"


# ============ Customer ============
class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(40), nullable=True)
    company = db.Column(db.String(120), nullable=True)
    country = db.Column(db.String(60), nullable=True)
    interest = db.Column(db.String(60), index=True)  # electronics, vehicles, etc.
    notes = db.Column(db.Text, nullable=True)
    lifetime_value = db.Column(db.Float, default=0.0)
    last_purchase_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sales = db.relationship("Sale", backref="customer", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "company": self.company,
            "country": self.country,
            "interest": self.interest,
            "lifetime_value": self.lifetime_value,
            "last_purchase_at": self.last_purchase_at.isoformat() if self.last_purchase_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Customer {self.id}: {self.name}>"


# ============ Sale ============
class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(40), unique=True, nullable=False, index=True)
    treasure_id = db.Column(db.String(40), db.ForeignKey("treasures.id"), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    # Money
    sold_price = db.Column(db.Float, nullable=False)
    cost_basis = db.Column(db.Float, nullable=False, default=0.0)
    commission_rate = db.Column(db.Float, default=0.10)  # 10%
    commission_amount = db.Column(db.Float, default=0.0)
    platform_fee = db.Column(db.Float, default=0.0)
    net_profit = db.Column(db.Float, default=0.0)

    # Status workflow
    status = db.Column(db.String(20), default="pending", index=True)  # pending|invoiced|paid|shipped|delivered|refunded|cancelled
    payment_method = db.Column(db.String(40), default="crypto", index=True)  # crypto|stripe|wire|cash
    payment_id = db.Column(db.String(120), nullable=True)  # external payment ID

    # Dates
    sold_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    shipped_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    refunded_at = db.Column(db.DateTime, nullable=True)

    notes = db.Column(db.Text, nullable=True)

    def to_dict(self, include_relations=True):
        d = {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "treasure_id": self.treasure_id,
            "customer_id": self.customer_id,
            "sold_price": self.sold_price,
            "cost_basis": self.cost_basis,
            "commission_rate": self.commission_rate,
            "commission_amount": self.commission_amount,
            "platform_fee": self.platform_fee,
            "net_profit": self.net_profit,
            "status": self.status,
            "payment_method": self.payment_method,
            "payment_id": self.payment_id,
            "sold_at": self.sold_at.isoformat() if self.sold_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "shipped_at": self.shipped_at.isoformat() if self.shipped_at else None,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
        }
        if include_relations:
            if self.treasure:
                d["treasure_title"] = self.treasure.title
            if self.customer:
                d["customer_name"] = self.customer.name
        return d

    def __repr__(self):
        return f"<Sale {self.invoice_number}: ${self.sold_price}>"


# ============ Alert ============
class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    treasure_id = db.Column(db.String(40), db.ForeignKey("treasures.id"), nullable=False, index=True)
    level = db.Column(db.String(20), default="info", index=True)  # info|warning|critical
    message = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "treasure_id": self.treasure_id,
            "level": self.level,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "acknowledged": self.acknowledged,
        }


# ============ Audit Log ============
class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    action = db.Column(db.String(80), nullable=False, index=True)
    entity_type = db.Column(db.String(40), nullable=True, index=True)
    entity_id = db.Column(db.String(40), nullable=True, index=True)
    changes = db.Column(db.Text, nullable=True)  # JSON
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "changes": json.loads(self.changes) if self.changes else None,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============ Init ============
def init_db():
    """Create tables and seed demo data."""
    db.create_all()
    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", email="admin@solomon.local", role="admin", active=True)
        admin.set_password("changeme")
        admin.generate_api_key()
        db.session.add(admin)
        db.session.commit()
        # Auto-seed demo data
        from app.models.seed import seed_demo_data
        seed_demo_data()
