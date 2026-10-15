import uuid
from pymongo import MongoClient

ALL_CITIES = ["Hyderabad", "Bangalore", "Mumbai", "Delhi", "Pune"]

MORE_PRODUCTS = [
    # Appliances -> Televisions (Add 2 to bring total to 6)
    {
        "rental_name": "LG 50-Inch 4K UHD Smart AI ThinQ LED TV",
        "category_id": "Appliances",
        "sub_category": "Televisions",
        "monthly_price": 799,
        "daily_price": 32,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=600",
        "description": "Magic remote control with AI acoustic tuning, HDR 10 Pro, and built-in Apple AirPlay 2."
    },
    {
        "rental_name": "Samsung 43-Inch Crystal 4K Vivid Pro Ultra HD Smart TV",
        "category_id": "Appliances",
        "sub_category": "Televisions",
        "monthly_price": 749,
        "daily_price": 30,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=600",
        "description": "PurColor lifelike color expression with SolarCell remote and OTS Lite Object Tracking Sound."
    },

    # Living Room -> Sofas (Add 2 to bring total to 6)
    {
        "rental_name": "Modern Minimalist Scandinavian 3-Seater Grey Fabric Sofa",
        "category_id": "Living Room",
        "sub_category": "Sofas",
        "monthly_price": 899,
        "daily_price": 36,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600",
        "description": "Light grey woven linen upholstery with natural beechwood tapered legs and pocketed spring core cushions."
    },
    {
        "rental_name": "Chesterfield Tufted Tan Leatherette 3-Seater Sofa",
        "category_id": "Living Room",
        "sub_category": "Sofas",
        "monthly_price": 1199,
        "daily_price": 48,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=600",
        "description": "Classic rolled armrests with deep button tufting and scratch-resistant breathable vegan leather."
    },

    # Living Room -> Chairs & Stools (Add 2 to bring total to 5)
    {
        "rental_name": "Velvet Wingback Accent Lounge Armchair with Ottoman",
        "category_id": "Living Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=600",
        "description": "Plush emerald green velvet wingback chair with high lumbar support and matching cushioned footrest stool."
    },
    {
        "rental_name": "Modern Swivel Recliner Chair with Ergonomic Headrest",
        "category_id": "Living Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 649,
        "daily_price": 26,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&q=80&w=600",
        "description": "360-degree rotating base with adjustable tension reclining mechanism and padded head pillow."
    },

    # Entertainment -> Projectors (Add 2 to bring total to 5)
    {
        "rental_name": "ViewSonic M1+ Ultra-Portable LED Cinema Projector with JBL Audio",
        "category_id": "Entertainment",
        "sub_category": "Projectors",
        "monthly_price": 899,
        "daily_price": 36,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600",
        "description": "Smart 360-degree swivel stand projecting onto walls or ceilings with built-in battery and dual JBL speakers."
    },
    {
        "rental_name": "Epson EpiqVision Mini Smart Laser TV Projector (EF-12)",
        "category_id": "Entertainment",
        "sub_category": "Projectors",
        "monthly_price": 1499,
        "daily_price": 60,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600",
        "description": "MicroLaser array technology delivering exceptional brightness and Sound by Yamaha audiophile acoustics."
    },

    # Entertainment -> Soundbars & Audio (Add 2 to bring total to 5)
    {
        "rental_name": "Bose Smart Soundbar 600 with Dolby Atmos and Voice4Video",
        "category_id": "Entertainment",
        "sub_category": "Soundbars & Audio",
        "monthly_price": 899,
        "daily_price": 36,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600",
        "description": "True spatial audio immersion with upward-firing transducers and proprietary TrueSpace processing."
    },
    {
        "rental_name": "boAt Aavante Bar 3150D 260W 5.1 Channel Bluetooth Soundbar",
        "category_id": "Entertainment",
        "sub_category": "Soundbars & Audio",
        "monthly_price": 389,
        "daily_price": 16,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600",
        "description": "High-octane Bollywood sound signature with wired subwoofer, surround satellites, and optical connectivity."
    },

    # Dining Room -> Chairs & Stools (Add 4 to bring total to 5)
    {
        "rental_name": "Set of 2 Ergonomic Molded Eames-Style Dining Chairs",
        "category_id": "Dining Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 249,
        "daily_price": 10,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=600",
        "description": "Iconic mid-century molded seat shells with beechwood dowel Eiffel legs and rubber floor protectors."
    },
    {
        "rental_name": "Set of 2 Solid Sheesham Dining Chairs with Cushion Seats",
        "category_id": "Dining Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 299,
        "daily_price": 12,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=600",
        "description": "Traditional Indian hardwood dining chairs with slatted backrest and high-density foam beige upholstery."
    },
    {
        "rental_name": "Set of 2 Industrial Metal Tolix Dining Chairs (Matte Black)",
        "category_id": "Dining Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 219,
        "daily_price": 9,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=600",
        "description": "Stackable galvanized steel café chairs with cross-brace support and indestructible rust-proof powder coating."
    },
    {
        "rental_name": "Set of 2 Velvet Dining Chairs with Golden Tapered Legs",
        "category_id": "Dining Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 349,
        "daily_price": 14,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=600",
        "description": "Luxurious curved back shell upholstered in stain-resistant teal velvet with electroplated brass legs."
    },

    # Packages (Add 2 to bring total to 6)
    {
        "rental_name": "Smart Studio Essentials Combo (Fridge + Washing Machine + Bed + Desk)",
        "category_id": "Packages",
        "sub_category": "Appliance Packages",
        "monthly_price": 1899,
        "daily_price": 75,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600",
        "description": "The ultimate turnkey starter bundle: 190L Refrigerator, 6.5Kg Auto Washer, Queen Bed, and WFH Study Desk with free delivery."
    },
    {
        "rental_name": "Executive WFH Productivity Suite (Ergo Chair + Standing Desk + 27' Monitor)",
        "category_id": "Packages",
        "sub_category": "Work from Home",
        "monthly_price": 1399,
        "daily_price": 55,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600",
        "description": "Complete ergonomic home office setup: motorized standing desk, high-back mesh chair, and full HD monitor with cable management."
    }
]

def seed_more():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['rentora_db']
    inserted = 0
    updated = 0

    for p in MORE_PRODUCTS:
        m_price = p["monthly_price"]
        doc = {
            "rental_name": p["rental_name"],
            "category_id": p["category_id"],
            "sub_category": p.get("sub_category", p["category_id"]),
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
            updated += 1
        else:
            doc["_id"] = str(uuid.uuid4())
            doc["appliance_id"] = str(uuid.uuid4())
            db.appliances.insert_one(doc)
            inserted += 1

    db.appliances.update_many({}, {"$set": {"available_cities": ALL_CITIES}})
    print(f"[SUCCESS] Added {inserted} items. New total: {db.appliances.count_documents({})}")

if __name__ == "__main__":
    seed_more()
