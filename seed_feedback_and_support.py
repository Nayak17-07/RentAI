import os
import sys
import uuid
import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.mongo_client import get_mongo_db

def seed():
    db = get_mongo_db()
    
    appliances = list(db.appliances.find({}).limit(10))
    if not appliances:
        print("No appliances found in DB to attach feedback to.")
        return

    sample_reviews = [
        ("Aarav Sharma", 5, "Outstanding washing machine! Delivered on time, free installation was super quick, and it works flawlessly."),
        ("Priya Nair", 5, "Renting this refrigerator saved me so much upfront cost. The energy efficiency is top notch!"),
        ("Rohan Kulkarni", 4, "Great product quality and very responsive customer support. The doorstep setup was smooth."),
        ("Sneha Iyer", 5, "Best decision for my 1-year work contract in Bangalore. No moving hassle!"),
        ("Vikram Singh", 4, "Good condition appliance, minor cosmetic scuff on side panel but ₹10k damage waiver gives peace of mind."),
        ("Ananya Das", 5, "Super clean appliance, quiet operation, and the monthly billing is totally seamless."),
    ]

    inserted_reviews = 0
    for idx, app in enumerate(appliances):
        app_id = app.get("appliance_id") or str(app["_id"])
        # Add 2 reviews per appliance if none exists
        if db.feedback.count_documents({"appliance_id": app_id}) == 0:
            for r_idx in range(2):
                reviewer, rating, comment = sample_reviews[(idx * 2 + r_idx) % len(sample_reviews)]
                db.feedback.insert_one({
                    "_id": str(uuid.uuid4()),
                    "user_id": f"seed_user_{idx}_{r_idx}",
                    "username": reviewer,
                    "appliance_id": app_id,
                    "rental_name": app.get("rental_name"),
                    "rating": rating,
                    "comment": comment,
                    "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=(idx * 3 + r_idx + 1))
                })
                inserted_reviews += 1

    print(f"Seeded {inserted_reviews} customer reviews in MongoDB 'feedback' collection.")

    # Seed sample complaints / support tickets
    if db.complaints.count_documents({}) == 0:
        sample_complaints = [
            {
                "_id": str(uuid.uuid4()),
                "ticket_id": "TKT-D81A24",
                "user_id": "cust_101",
                "customer_name": "Aarav Sharma",
                "customer_email": "aarav.sharma@example.com",
                "subject": "Delivery Slot Rescheduling Request",
                "category": "Delivery",
                "description": "I will be traveling on Saturday morning. Can the delivery executive arrive after 3 PM instead?",
                "status": "IN_REVIEW",
                "priority": "MEDIUM",
                "created_at": datetime.datetime.utcnow() - datetime.timedelta(hours=6),
                "resolution_notes": ""
            },
            {
                "_id": str(uuid.uuid4()),
                "ticket_id": "TKT-B99C31",
                "user_id": "cust_102",
                "customer_name": "Divya Reddy",
                "customer_email": "divya.reddy@example.com",
                "subject": "Filter Cleaning Maintenance Question",
                "category": "Appliance Quality",
                "description": "How frequently should the lint filter be cleaned in the 7kg washing machine? Does Rentora provide free technician visit?",
                "status": "RESOLVED",
                "priority": "LOW",
                "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=2),
                "resolved_at": datetime.datetime.utcnow() - datetime.timedelta(days=1),
                "resolution_notes": "Explained standard 3-month periodic servicing schedule and scheduled complimentary technician checkup for next Tuesday."
            },
            {
                "_id": str(uuid.uuid4()),
                "ticket_id": "TKT-F43E88",
                "user_id": "cust_103",
                "customer_name": "Karthik Verma",
                "customer_email": "karthik.v@example.com",
                "subject": "Deposit Refund Confirmation Query",
                "category": "Billing/Deposit",
                "description": "Returned my study desk yesterday; wanted to confirm the refund transaction ID REF_8923AB credit timeline.",
                "status": "RESOLVED",
                "priority": "MEDIUM",
                "created_at": datetime.datetime.utcnow() - datetime.timedelta(days=3),
                "resolved_at": datetime.datetime.utcnow() - datetime.timedelta(days=2),
                "resolution_notes": "Confirmed bank IMPS reference. Deposit credited to customer ICICI account."
            }
        ]
        db.complaints.insert_many(sample_complaints)
        print("Seeded sample customer service complaints in MongoDB 'complaints' collection.")

if __name__ == "__main__":
    seed()
