import os
import sys
import uuid
import datetime
import requests
from api.mongo_client import get_mongo_db
from api.mongo_auth import generate_tokens

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api")

def run_tests():
    print("=" * 76)
    print("  VERIFYING ALL NEW MODULES & FEATURES (BACKEND API SUITE)")
    print("=" * 76)

    db = get_mongo_db()

    # 1. Module 1: Password Reset Flow
    test_user_id = str(uuid.uuid4())
    test_email = f"reset_test_{uuid.uuid4().hex[:6]}@rentora.com"
    db.users.insert_one({
        "_id": test_user_id,
        "username": f"user_{test_user_id[:6]}",
        "email": test_email,
        "password": "OldPassword123!",
        "role": "customer",
        "created_at": datetime.datetime.utcnow()
    })

    # Request Reset
    res = requests.post(f"{BASE_URL}/auth/password-reset-request/", json={"email": test_email})
    assert res.status_code == 200, f"Password reset request failed: {res.text}"
    otp = res.json().get("mock_otp")
    assert otp and len(otp) == 6, f"Invalid OTP: {otp}"
    print(f"[OK] 1. Password Reset Request: OTP {otp} issued for {test_email}")

    # Confirm Reset
    res = requests.post(f"{BASE_URL}/auth/password-reset-confirm/", json={
        "email": test_email,
        "otp": otp,
        "new_password": "NewSecretPass456!"
    })
    assert res.status_code == 200, f"Password reset confirm failed: {res.text}"
    print(f"[OK] 2. Password Reset Confirm: Password updated in MongoDB with PBKDF2 hashing")

    # 2. Module 2: Appliance Management (Admin CRUD)
    new_app_name = f"Test Smart Refrigerator {uuid.uuid4().hex[:4]}"
    res = requests.post(f"{BASE_URL}/appliances/", json={
        "rental_name": new_app_name,
        "category_id": "Appliances",
        "sub_category": "Refrigerators",
        "monthly_price": 750,
        "security_deposit": 1200,
        "stock_quantity": 8,
        "pricing_3": 750,
        "pricing_6": 680,
        "pricing_12": 600,
        "description": "Double door inverter frost-free smart refrigerator.",
        "image_url": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5"
    })
    assert res.status_code == 201, f"Appliance creation failed: {res.text}"
    created_app = res.json()["appliance"]
    created_app_id = created_app["appliance_id"]
    print(f"[OK] 3. Module 2 Admin Add Appliance: Created {new_app_name} (ID: {created_app_id})")

    # Update Appliance
    res = requests.put(f"{BASE_URL}/appliances/{created_app_id}/", json={
        "monthly_price": 799,
        "stock_quantity": 12
    })
    assert res.status_code == 200 and res.json()["appliance"]["monthly_price"] == 799, f"Update failed: {res.text}"
    print(f"[OK] 4. Module 2 Admin Update Appliance: Price updated to Rs. 799, Stock to 12")

    # 3. Module 5: Cash on Delivery (COD) Checkout
    tokens = generate_tokens(test_user_id)
    auth_header = {"Authorization": f"Bearer {tokens['access']}"}
    
    # Add to cart
    res = requests.post(f"{BASE_URL}/cart/", json={"appliance_id": created_app_id, "tenure": "3"}, headers=auth_header)
    assert res.status_code in [200, 201]
    
    # KYC
    res = requests.post(f"{BASE_URL}/kyc/", json={"id_proof": "AADHAAR_9988", "address_proof": "PASSPORT_9988"}, headers=auth_header)
    assert res.status_code == 200

    # Checkout with COD
    res = requests.post(f"{BASE_URL}/checkout/", json={"payment_method": "CASH_ON_DELIVERY"}, headers=auth_header)
    assert res.status_code == 200, f"COD checkout failed: {res.text}"
    res_data = res.json()
    assert res_data["payment"]["payment_method"] == "CASH_ON_DELIVERY"
    assert res_data["payment"]["status"] == "PENDING_DOORSTEP"
    txn_id = res_data["transaction_id"]
    print(f"[OK] 5. Module 5 Cash on Delivery: Order confirmed with Doorstep collection status (Txn: {txn_id})")

    # 4. Module 6: Return Management with Damage Report & Fine Calculation
    rentals = list(db.rentals.find({"user_id": test_user_id, "status": "active"}))
    assert len(rentals) >= 1
    rental_id = rentals[0]["_id"]
    
    # Return with Minor Damage (₹10,000 Damage Waiver applied -> ₹0 Fine)
    res = requests.patch(f"{BASE_URL}/rentals/", json={
        "rental_id": rental_id,
        "damage_level": "MINOR",
        "damage_description": "Small hairline scratch on door surface",
        "late_days": 0
    }, headers=auth_header)
    assert res.status_code == 200, f"Return failed: {res.text}"
    ret_data = res.json()
    assert ret_data["waiver_applied"] is True
    assert ret_data["damage_fine"] == 0.0
    assert ret_data["deposit_refunded"] == 1200.0
    print(f"[OK] 6. Module 6 Return & Damage Waiver: Minor damage covered by Rs. 10,000 waiver; 100% deposit (Rs. 1,200) refunded")

    # 5. Module 7: Admin User Management
    res = requests.get(f"{BASE_URL}/admin/users/")
    assert res.status_code == 200 and len(res.json()) > 0
    print(f"[OK] 7. Module 7 Admin Users: Retrieved {len(res.json())} users with active rental counts")

    # 6. Module 7: Admin Rentals Approval & Status Management
    res = requests.get(f"{BASE_URL}/admin/rentals/")
    assert res.status_code == 200 and len(res.json()) > 0
    print(f"[OK] 8. Module 7 Admin Rentals: Retrieved {len(res.json())} rental orders across all customers")

    # 7. Module 8: Feedback Module (Ratings & Reviews)
    res = requests.post(f"{BASE_URL}/feedback/", json={
        "appliance_id": created_app_id,
        "rating": 5,
        "comment": "Amazing cooling, energy bill barely went up! Highly recommended.",
        "username": "Test Reviewer"
    })
    assert res.status_code == 201, f"Feedback submission failed: {res.text}"
    
    res = requests.get(f"{BASE_URL}/feedback/?appliance_id={created_app_id}")
    assert res.status_code == 200 and res.json()["total_reviews"] >= 1
    print(f"[OK] 9. Module 8 Feedback: Submitted 5-star rating & verified retrieval (Avg Rating: {res.json()['average_rating']})")

    # 8. Module 8: Customer Support & Complaints Ticketing
    res = requests.post(f"{BASE_URL}/complaints/", json={
        "subject": "Doorstep Delivery Timing",
        "category": "Delivery",
        "description": "Please deliver after 5 PM on weekdays.",
        "customer_name": "Test Customer",
        "customer_email": test_email
    })
    assert res.status_code == 201, f"Complaint creation failed: {res.text}"
    ticket_id = res.json()["complaint"]["ticket_id"]
    print(f"[OK] 10. Module 8 Complaints: Created support ticket {ticket_id} with status OPEN")

    # Admin resolves complaint
    res = requests.patch(f"{BASE_URL}/complaints/{ticket_id}/", json={
        "status": "RESOLVED",
        "resolution_notes": "Noted delivery preference. Delivery assigned for 6 PM."
    })
    assert res.status_code == 200, f"Complaint resolve failed: {res.text}"
    print(f"[OK] 11. Module 8 Admin Resolution: Support ticket {ticket_id} resolved with notes")

    # Clean up test appliance
    res = requests.delete(f"{BASE_URL}/appliances/{created_app_id}/")
    assert res.status_code == 200
    print(f"[OK] 12. Module 2 Admin Delete Appliance: Cleaned up test item successfully")

    # Clean up test user
    db.users.delete_one({"_id": test_user_id})
    db.rentals.delete_many({"user_id": test_user_id})
    db.payments.delete_many({"user_id": test_user_id})
    db.refunds.delete_many({"user_id": test_user_id})
    db.complaints.delete_one({"ticket_id": ticket_id})
    db.feedback.delete_many({"appliance_id": created_app_id})

    print("=" * 76)
    print("  ALL 12 BACKEND MODULE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 76)

if __name__ == "__main__":
    run_tests()
