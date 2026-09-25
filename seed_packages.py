import os
import sys
import uuid

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentai_core.settings')

import django
django.setup()

from api.mongo_client import get_mongo_db

ALL_CITIES = ["Hyderabad", "Bangalore", "Mumbai", "Delhi", "Pune"]

PACKAGES = [
    {
        "rental_name": "Appliance Essentials Combo (Fridge + Washing Machine + Microwave)",
        "category_id": "Packages",
        "sub_category": "Appliance Packages",
        "monthly_price": 1599,
        "daily_price": 64,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600",
        "description": "Complete kitchen and laundry setup: 260L Double Door Refrigerator + 6.5 Kg Top Load Washing Machine + 20L Solo Microwave. Save ₹400/mo over individual items."
    },
    {
        "rental_name": "WFH Executive Productivity Suite (Ergonomic Chair + Desk)",
        "category_id": "Packages",
        "sub_category": "Work from Home",
        "monthly_price": 799,
        "daily_price": 32,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
        "description": "High-Back Ergonomic Breathable Mesh Swivel Chair paired with Modern Teak Engineered Wood Study Desk with Drawer."
    },
    {
        "rental_name": "1 BHK Comfort Living Room Combo (3-Seater Sofa + Coffee Table)",
        "category_id": "Packages",
        "sub_category": "Living Room Packages",
        "monthly_price": 1249,
        "daily_price": 50,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600",
        "description": "Velvet Luxe 3-Seater Couch with deep cushioning and matching Round Wooden Center Coffee Table."
    },
    {
        "rental_name": "Master Bedroom Package (Queen Bed + Dual Comfort Mattress)",
        "category_id": "Packages",
        "sub_category": "Bedroom Packages",
        "monthly_price": 1049,
        "daily_price": 42,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600",
        "description": "Solid Wood Teak-Finish Queen Bed with plush fabric headboard and 6-inch Orthopedic Memory Foam Mattress."
    }
]

def seed_packages():
    db = get_mongo_db()
    for p in PACKAGES:
        m_price = p["monthly_price"]
        doc = {
            "rental_name": p["rental_name"],
            "category_id": p["category_id"],
            "sub_category": p["sub_category"],
            "daily_price": p["daily_price"],
            "monthly_price": m_price,
            "pricing": {
                "3": m_price,
                "6": int(m_price * 0.9),
                "12": int(m_price * 0.8)
            },
            "security_deposit": int(m_price * 1.5),
            "available_cities": ALL_CITIES,
            "description": p["description"],
            "image_url": p["image_url"],
            "tag": p.get("tag", "Best Seller"),
            "stock_quantity": 10
        }

        existing = db.appliances.find_one({"rental_name": p["rental_name"]})
        if existing:
            db.appliances.update_one({"_id": existing["_id"]}, {"$set": doc})
        else:
            doc["_id"] = str(uuid.uuid4())
            doc["appliance_id"] = str(uuid.uuid4())
            db.appliances.insert_one(doc)

    print(f"[SUCCESS] Seeded {len(PACKAGES)} curated room & appliance packages into MongoDB.")

if __name__ == "__main__":
    seed_packages()
