"""
app/models/seed.py - Demo data seeding
"""
import random
from datetime import datetime, timedelta
from app.extensions import db
from app.models import User, Treasure, Customer, Sale, Alert


DEMO_TREASURES = [
    ("GOV_seed01", "Lot of 200 x Dell Latitude E7470 Laptops", "electronics", "used", 12000, 85000, "govdeals", "Texas, USA", 0.15),
    ("GOV_seed02", "Pallet of Medical Surgical Supplies - Exp 2027", "medical", "new", 4500, 22000, "govdeals", "California, USA", 0.10),
    ("GOV_seed03", "2018 Caterpillar 320 GC Excavator - 1200 hrs", "heavy_equipment", "used", 78000, 95000, "govdeals", "Florida, USA", 0.20),
    ("GOV_seed04", "Surplus Server Rack - 42U with PDU", "electronics", "used", 2200, 6800, "govdeals", "Virginia, USA", 0.18),
    ("GOV_seed05", "Lot of 100 x iPhone 12 - Unlocked - Mixed Cond", "electronics", "used", 18000, 52000, "govdeals", "New York, USA", 0.12),
    ("GOV_seed06", "Lot of 50 x Dell OptiPlex 7060 i7", "electronics", "refurbished", 3500, 18000, "govdeals", "Ohio, USA", 0.15),
    ("GOV_seed07", "Forklift Toyota 8FGCU25 - LPG - 2019", "heavy_equipment", "used", 14500, 22000, "govdeals", "Illinois, USA", 0.22),
    ("GOV_seed08", "Lab Microscope Olympus CX23 - 10 units", "medical", "used", 3800, 12500, "govdeals", "Massachusetts, USA", 0.15),
    ("GOV_seed09", "2015 Ford F-150 XLT - 89k miles - Salvage", "vehicles", "used", 9200, 15500, "govdeals", "Georgia, USA", 0.18),
    ("GOV_seed10", "Lot of 25 x Cisco Catalyst 2960-X Switches", "electronics", "used", 4100, 14800, "govdeals", "Washington, USA", 0.12),
    ("CRYPTO_seed01", "0.5 BTC - seized from auction", "crypto", "used", 28000, 32000, "crypto", "Online", 0.05),
    ("CRYPTO_seed02", "12 ETH lot - seized from mixer", "crypto", "used", 35000, 39000, "crypto", "Online", 0.08),
]


DEMO_CUSTOMERS = [
    ("Mike Chen", "mike@chenresale.com", "vehicles", "California", "Mike Chen Resale"),
    ("Sarah Johnson", "sarah@bulktech.io", "electronics", "Texas", "BulkTech LLC"),
    ("أحمد المحمد", "ahmed@gulf-merchant.com", "general", "UAE", "Gulf Merchant FZE"),
    ("Hans Mueller", "h.mueller@europarts.de", "heavy_equipment", "Germany", "Europarts GmbH"),
    ("Priya Patel", "priya@medsupply.in", "medical", "India", "MedSupply Pvt Ltd"),
]


def seed_demo_data():
    """Seed database with realistic demo data."""
    print("🌱 Seeding demo data...")

    # Treasures
    treasures = []
    for tid, title, cat, cond, price, est, src, loc, risk in DEMO_TREASURES:
        t = Treasure(
            id=tid,
            title=title,
            description=f"Demo listing for {title}. All units tested and verified.",
            category=cat,
            condition=cond,
            source=src,
            source_url=f"https://{src}.example/listing/{tid}",
            location=loc,
            price=price,
            estimated_value=est,
            profit_pct=((est - price) / price) * 100,
            status="analyzed",
            risk_score=risk,
            ml_confidence=random.uniform(0.75, 0.95),
        )
        db.session.add(t)
        treasures.append(t)
    db.session.commit()

    # Customers
    customers = []
    for name, email, interest, country, company in DEMO_CUSTOMERS:
        c = Customer(
            name=name, email=email, interest=interest,
            country=country, company=company,
            lifetime_value=random.uniform(5000, 100000),
        )
        db.session.add(c)
        customers.append(c)
    db.session.commit()  # ensure customer IDs are assigned

    # Sales (historical)
    for i in range(6):
        cust = random.choice(customers)
        tres = random.choice(treasures)
        sold_price = tres.estimated_value * random.uniform(0.6, 0.9)
        cost = tres.price
        commission = sold_price * 0.10
        fee = sold_price * 0.05
        profit = sold_price - cost - commission - fee
        sale = Sale(
            invoice_number=f"INV-202609-{i:03d}",
            treasure_id=tres.id,
            customer_id=cust.id,
            sold_price=round(sold_price, 2),
            cost_basis=round(cost, 2),
            commission_rate=0.10,
            commission_amount=round(commission, 2),
            platform_fee=round(fee, 2),
            net_profit=round(profit, 2),
            status=random.choice(["delivered", "delivered", "paid", "shipped"]),
            payment_method=random.choice(["crypto", "wire", "stripe"]),
            sold_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
            paid_at=datetime.utcnow() - timedelta(days=random.randint(1, 80)),
        )
        db.session.add(sale)
    db.session.commit()

    # Alerts
    high_profit = [t for t in treasures if t.profit_pct >= 300]
    for t in high_profit[:3]:
        a = Alert(
            treasure_id=t.id,
            level="critical" if t.profit_pct >= 500 else "warning",
            message=f"🔥 HIGH PROFIT: {t.profit_pct:.0f}% margin on {t.title[:60]}",
        )
        db.session.add(a)

    db.session.commit()
    print(f"  ✓ {len(treasures)} treasures")
    print(f"  ✓ {len(customers)} customers")
    print(f"  ✓ 6 historical sales")
    print("✅ Seed complete.")
