import os
import sys
import json
import uuid

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.mongo_client import get_mongo_db

def seed_database():
    try:
        db = get_mongo_db()
        
        # Read the JSON file
        with open('mock_products.json', 'r') as f:
            products = json.load(f)
            
        print(f"Loaded {len(products)} products from JSON.")
        
        # Clear existing appliances to prevent duplicates (optional, but good for a fresh seed)
        # Uncomment if you want to clear first:
        db.appliances.delete_many({})
        print("Cleared existing appliances.")
        
        # Prepare the documents
        documents = []
        for p in products:
            doc = {
                "_id": str(uuid.uuid4()),
                "appliance_id": str(uuid.uuid4()),
                "rental_name": p["rental_name"],
                "category_id": p["category_id"],
                "daily_price": p["daily_price"],
                "monthly_price": p["monthly_price"],
                "pricing": p.get("pricing", {"3": p["monthly_price"], "6": int(p["monthly_price"] * 0.9), "12": int(p["monthly_price"] * 0.8)}),
                "security_deposit": p.get("security_deposit", int(p["monthly_price"] * 1.5)),
                "available_cities": p.get("available_cities", ["Bangalore", "Mumbai"]),
                "description": p["description"],
                "image_url": p["image_url"],
                "stock_quantity": 10  # Mock stock
            }
            documents.append(doc)
            
        # Insert into MongoDB
        if documents:
            result = db.appliances.insert_many(documents)
            print(f"[SUCCESS] Successfully inserted {len(result.inserted_ids)} appliances into MongoDB.")
            
    except Exception as e:
        print("[ERROR] Failed to seed database.")
        print(f"Error: {e}")

if __name__ == '__main__':
    seed_database()
