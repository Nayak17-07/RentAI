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

PREMIUM_PRODUCTS = [
    # --- WASHING MACHINES (Matches Screenshot 2!) ---
    {
        "rental_name": "Fully Automatic Top Load Washing Machine (6.5 Kg)",
        "category_id": "Appliances",
        "sub_category": "Washing Machines",
        "monthly_price": 808,
        "daily_price": 32,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=600",
        "description": "Smart Inverter technology with waterfall circulation and 8 customized wash cycles for gentle, thorough garment cleaning."
    },
    {
        "rental_name": "Semi Automatic Washing Machine (7 Kg)",
        "category_id": "Appliances",
        "sub_category": "Washing Machines",
        "monthly_price": 441,
        "daily_price": 18,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&q=80&w=600",
        "description": "Durable dual-tub system with roller jet pulsator and high-speed air turbo spin dryer for rapid clothes drying."
    },
    {
        "rental_name": "Fully Automatic Top Load Washing Machine (6 Kg)",
        "category_id": "Appliances",
        "sub_category": "Washing Machines",
        "monthly_price": 764,
        "daily_price": 30,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&q=80&w=600",
        "description": "Compact stainless steel drum washer with digital inverter motor and quick 15-minute express cycle."
    },
    {
        "rental_name": "Front Load Fully Automatic Washing Machine (7.5 Kg)",
        "category_id": "Appliances",
        "sub_category": "Washing Machines",
        "monthly_price": 1099,
        "daily_price": 44,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=600",
        "description": "Ultra-efficient steam wash cycle with 1400 RPM spin and allergen protection mode for delicate laundry."
    },
    {
        "rental_name": "Inverter Fully Automatic Top Load Washing Machine (8 Kg)",
        "category_id": "Appliances",
        "sub_category": "Washing Machines",
        "monthly_price": 849,
        "daily_price": 34,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=600",
        "description": "Large capacity washer with smart auto-balance detection and hygienic tub clean feature."
    },
    {
        "rental_name": "Smart Washer Dryer Combo (8/5 Kg)",
        "category_id": "Appliances",
        "sub_category": "Washing Machines",
        "monthly_price": 1299,
        "daily_price": 52,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=600",
        "description": "All-in-one washing and 100% condensation drying with smart Wi-Fi controls."
    },

    # --- REFRIGERATORS ---
    {
        "rental_name": "Single Door Direct Cool Refrigerator (190L)",
        "category_id": "Appliances",
        "sub_category": "Refrigerators",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&q=80&w=600",
        "description": "Energy-efficient 4-star direct cool refrigerator with toughened glass shelves and base drawer."
    },
    {
        "rental_name": "Double Door Frost Free Refrigerator (260L)",
        "category_id": "Appliances",
        "sub_category": "Refrigerators",
        "monthly_price": 899,
        "daily_price": 36,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=600",
        "description": "Twin cooling plus technology with convertible 5-in-1 modes and frost-free operation."
    },
    {
        "rental_name": "French Door Smart Inverter Refrigerator (350L)",
        "category_id": "Appliances",
        "sub_category": "Refrigerators",
        "monthly_price": 1399,
        "daily_price": 55,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1536353284924-9240ccfc426e?auto=format&fit=crop&q=80&w=600",
        "description": "Premium multi-door refrigerator with humidity controlled crisper and digital inverter compressor."
    },

    # --- WATER PURIFIERS (Screenshot 1 promo!) ---
    {
        "rental_name": "RO + UV + Mineralizer Water Purifier (7L)",
        "category_id": "Appliances",
        "sub_category": "Water Purifiers",
        "monthly_price": 399,
        "daily_price": 16,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=600",
        "description": "Multi-stage advanced purification with active copper mineral infusion and taste enhancer."
    },
    {
        "rental_name": "Smart Alkaline RO Water Purifier with Display",
        "category_id": "Appliances",
        "sub_category": "Water Purifiers",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&q=80&w=600",
        "description": "Digital TDS monitor with filter change alerts and 8L storage capacity."
    },

    # --- AIR CONDITIONERS ---
    {
        "rental_name": "1.5 Ton 3-Star Inverter Split AC",
        "category_id": "Appliances",
        "sub_category": "Air Conditioners",
        "monthly_price": 1199,
        "daily_price": 48,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600",
        "description": "Copper condenser with dual rotary compressor, PM 2.5 air filter, and 4-way auto swing."
    },
    {
        "rental_name": "1 Ton 5-Star Dual Inverter Split AC",
        "category_id": "Appliances",
        "sub_category": "Air Conditioners",
        "monthly_price": 1049,
        "daily_price": 42,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1614631446501-abcf76949eca?auto=format&fit=crop&q=80&w=600",
        "description": "Ultra silent cooling with convertible cooling capacity and stabilizers-free operation."
    },

    # --- MICROWAVES ---
    {
        "rental_name": "28L Convection Microwave Oven with Auto-Cook",
        "category_id": "Appliances",
        "sub_category": "Microwaves",
        "monthly_price": 429,
        "daily_price": 17,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600",
        "description": "Bake, grill, defrost, and reheat with over 100 auto-cook Indian recipes."
    },
    {
        "rental_name": "20L Solo Microwave Oven",
        "category_id": "Appliances",
        "sub_category": "Microwaves",
        "monthly_price": 299,
        "daily_price": 12,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1585338447937-7052fcb35c08?auto=format&fit=crop&q=80&w=600",
        "description": "Compact and reliable solo microwave oven ideal for heating and basic cooking."
    },

    # --- TELEVISIONS ---
    {
        "rental_name": "55-Inch 4K Ultra HD Smart LED TV",
        "category_id": "Appliances",
        "sub_category": "Televisions",
        "monthly_price": 999,
        "daily_price": 40,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=600",
        "description": "Bezel-less Dolby Vision HDR display with Google TV and 30W stereo speakers."
    },
    {
        "rental_name": "43-Inch Full HD Smart Android TV",
        "category_id": "Appliances",
        "sub_category": "Televisions",
        "monthly_price": 699,
        "daily_price": 28,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=600",
        "description": "Vibrant Full HD smart panel with pre-installed Netflix, Prime Video, and Chromecast."
    },

    # --- BEDS & BEDROOM ---
    {
        "rental_name": "Queen Size Wooden Bed with Upholstered Headboard",
        "category_id": "Bedroom",
        "sub_category": "Beds",
        "monthly_price": 799,
        "daily_price": 32,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600",
        "description": "Solid teak-finish queen bed with plush cushioned fabric headboard and slatted base."
    },
    {
        "rental_name": "King Size Platform Storage Bed",
        "category_id": "Bedroom",
        "sub_category": "Beds",
        "monthly_price": 1099,
        "daily_price": 44,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&q=80&w=600",
        "description": "Spacious hydraulic lift-up storage bed with rich walnut grain finish."
    },
    {
        "rental_name": "6-Inch Dual Comfort Orthopedic Queen Mattress",
        "category_id": "Bedroom",
        "sub_category": "Mattresses",
        "monthly_price": 349,
        "daily_price": 14,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600",
        "description": "High resilience foam mattress offering dual firmness for optimum spine support."
    },

    # --- SOFAS & LIVING ROOM ---
    {
        "rental_name": "Velvet Luxe 3-Seater Comfort Sofa",
        "category_id": "Living Room",
        "sub_category": "Sofas",
        "monthly_price": 925,
        "daily_price": 37,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600",
        "description": "Deep-cushioned premium velvet sofa with solid hardwood frame and gold accents."
    },
    {
        "rental_name": "L-Shaped Sectional Fabric Sofa (5-Seater)",
        "category_id": "Living Room",
        "sub_category": "Sofas",
        "monthly_price": 1499,
        "daily_price": 60,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=600",
        "description": "Spacious family lounge sectional with high-density foam seats and stain-resistant fabric."
    },
    {
        "rental_name": "High-Back Ergonomic Executive Mesh Chair",
        "category_id": "Living Room",
        "sub_category": "Chairs & Stools",
        "monthly_price": 475,
        "daily_price": 19,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=600",
        "description": "Breathable mesh back with adjustable lumbar support, 3D armrests, and pneumatic height adjustment."
    },
    {
        "rental_name": "Engineered Wood Modern Study Desk with Drawer",
        "category_id": "Living Room",
        "sub_category": "Study Tables",
        "monthly_price": 399,
        "daily_price": 16,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
        "description": "Minimalist work desk with integrated cable organizer grommet and smooth-glide stationery drawer."
    },
    {
        "rental_name": "Solid Wood 4-Seater Dining Table Set",
        "category_id": "Dining Room",
        "sub_category": "Tables",
        "monthly_price": 849,
        "daily_price": 34,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600",
        "description": "Natural oak dining table with four ergonomic padded cushioned dining chairs."
    }
]

def seed_premium():
    db = get_mongo_db()
    print("Seeding premium realistic inventory across Indian cities...")
    
    # We update or insert each product to be available across all 5 major Indian cities
    inserted_count = 0
    updated_count = 0

    for p in PREMIUM_PRODUCTS:
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
            updated_count += 1
        else:
            doc["_id"] = str(uuid.uuid4())
            doc["appliance_id"] = str(uuid.uuid4())
            db.appliances.insert_one(doc)
            inserted_count += 1

    # Ensure existing appliances also have all cities
    db.appliances.update_many({}, {"$set": {"available_cities": ALL_CITIES}})

    print(f"[SUCCESS] Updated {updated_count} and inserted {inserted_count} premium catalog items.")
    print(f"Total active catalog size in MongoDB: {db.appliances.count_documents({})}")

if __name__ == "__main__":
    seed_premium()
