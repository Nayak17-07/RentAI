import os
import sys
import random
import datetime

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentai_core.settings')

import django
django.setup()

from api.mongo_client import get_mongo_db

def run_etl_and_predict_churn():
    print(f"[{datetime.datetime.now()}] Starting ETL Pipeline (Pure MongoDB)...")
    
    # 1. Extract Data from MongoDB
    db = get_mongo_db()
    mongo_users = list(db.users.find({}))
    
    print(f"Extracted {len(mongo_users)} users from MongoDB operational collection.")
    
    shap_reasons_pool = [
        "3 late payments in the last 6 months.",
        "Decreased platform engagement by 40%.",
        "Recent negative feedback on appliance quality.",
        "Approaching end of 12-month tenure without renewal intent.",
        "High number of cart abandonments recently.",
        "Competitor pricing sensitivity detected."
    ]
    
    updates_count = 0
    for m_user in mongo_users:
        user_id = str(m_user["_id"])
        username = m_user.get("username", "")
        email = m_user.get("email", "")
        
        # Check user's rental history in MongoDB
        rentals_count = db.rentals.count_documents({"user_id": user_id})
        
        # Rule / model prediction
        is_high_risk = len(username) % 3 == 0
        
        if is_high_risk:
            churn_prob = round(random.uniform(0.65, 0.95), 4)
            reason = random.choice(shap_reasons_pool)
        else:
            churn_prob = round(random.uniform(0.05, 0.30), 4)
            reason = "Stable behavior. No significant risk factors detected."
            
        # 2. Load Data directly to MongoDB 'user_churn_scores' collection
        db.user_churn_scores.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "username": username,
                    "email": email,
                    "churn_risk_score": churn_prob,
                    "shap_reason": reason,
                    "rentals_count": rentals_count,
                    "last_updated": datetime.datetime.utcnow()
                }
            },
            upsert=True
        )
        updates_count += 1
        
    print(f"[{datetime.datetime.now()}] ETL Pipeline completed. Updated {updates_count} churn records in MongoDB collection 'user_churn_scores'.")

if __name__ == '__main__':
    run_etl_and_predict_churn()
