import uuid
import datetime
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .mongo_client import get_mongo_db
from .mongo_auth import generate_tokens, MongoJWTAuthentication
import jwt
from django.conf import settings

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        db = get_mongo_db()
        
        if db.users.find_one({"username": data.get("username")}):
            return Response({"error": ["Username already exists"]}, status=status.HTTP_400_BAD_REQUEST)
        if db.users.find_one({"email": data.get("email")}):
            return Response({"error": ["Email already exists"]}, status=status.HTTP_400_BAD_REQUEST)
            
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "username": data.get("username"),
            "email": data.get("email"),
            "password": make_password(data.get("password")),
            "phone_num": data.get("phone_num", ""),
            "role": data.get("role", "customer"),
            "created_at": datetime.datetime.utcnow()
        }
        
        db.users.insert_one(user_doc)
        
        # Send welcome email
        if data.get("email"):
            try:
                send_mail(
                    subject='Welcome to RentAI!',
                    message=f'Hi {data.get("username")},\n\nWelcome to RentAI! We are thrilled to have you onboard.\nStart renting premium furniture today!\n\nBest,\nThe RentAI Team',
                    from_email='support@rentai.com',
                    recipient_list=[data.get("email")],
                    fail_silently=True,
                )
            except Exception as e:
                print("Failed to send welcome email:", e)
        
        # Don't return tokens directly here to match the frontend flow (which expects empty OR uses the separate token endpoint)
        # Actually our frontend expects empty and then logs in manually via `/api/token/`, so just return success
        return Response({"success": "Account created"}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        db = get_mongo_db()
        user = db.users.find_one({"username": username})
        
        if user and check_password(password, user["password"]):
            tokens = generate_tokens(user["_id"])
            return Response(tokens, status=status.HTTP_200_OK)
            
        return Response({"detail": "No active account found with the given credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload['user_id']
            tokens = generate_tokens(user_id)
            return Response(tokens, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError:
            return Response({"error": "Refresh token expired"}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)

class ApplianceView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        db = get_mongo_db()
        city = request.query_params.get("city", None)
        search = request.query_params.get("search", None)
        
        query = {"stock_quantity": {"$gt": 0}}
        if city:
            query["available_cities"] = city
        if search:
            query["$or"] = [
                {"rental_name": {"$regex": search, "$options": "i"}},
                {"category_id": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
            
        appliances = list(db.appliances.find(query))
        for app in appliances:
            app["_id"] = str(app["_id"])
            
        return Response(appliances, status=status.HTTP_200_OK)

class RecommendationView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        
        recs = list(db.appliance_recommendations.find({"user_id": user_id}).sort("last_updated", -1))
        
        result = []
        for rec in recs:
            app = db.appliances.find_one({"_id": rec["recommended_appliance_id"]})
            if app:
                app["_id"] = str(app["_id"])
                result.append({
                    "recommendation_id": str(rec["_id"]),
                    "recommended_appliance_details": app,
                    "last_updated": rec["last_updated"]
                })
                
        # Mock recommendation for empty state testing
        if not result:
            app = db.appliances.find_one()
            if app:
                app["_id"] = str(app["_id"])
                result.append({
                    "recommendation_id": str(uuid.uuid4()),
                    "recommended_appliance_details": app,
                    "last_updated": datetime.datetime.utcnow()
                })
                
        return Response(result, status=status.HTTP_200_OK)

class CartView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        
        cart_items = list(db.carts.find({"user_id": user_id}))
        
        result = []
        for item in cart_items:
            app = db.appliances.find_one({"appliance_id": item["appliance_id"]})
            if app:
                app["_id"] = str(app["_id"])
                result.append({
                    "cart_item_id": str(item["_id"]),
                    "appliance": app,
                    "tenure": item.get("tenure", "3"),
                    "added_at": item["added_at"]
                })
                
        return Response(result, status=status.HTTP_200_OK)
        
    def post(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        appliance_id = request.data.get("appliance_id")
        tenure = request.data.get("tenure", "3") # default to 3 months if not provided
        
        if not appliance_id:
            return Response({"error": "appliance_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Optional: Can allow multiple of same item or update tenure instead of blocking
        # If already in cart, just update tenure
        existing = db.carts.find_one({"user_id": user_id, "appliance_id": appliance_id})
        if existing:
            db.carts.update_one({"_id": existing["_id"]}, {"$set": {"tenure": tenure}})
            return Response({"message": "Cart item updated"}, status=status.HTTP_200_OK)
            
        db.carts.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "appliance_id": appliance_id,
            "tenure": tenure,
            "added_at": datetime.datetime.utcnow()
        })
        
        return Response({"success": "Added to cart"}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        appliance_id = request.data.get("appliance_id")
        
        if appliance_id:
            db.carts.delete_one({"user_id": user_id, "appliance_id": appliance_id})
        else:
            db.carts.delete_many({"user_id": user_id})
            
        return Response({"success": "Removed from cart"}, status=status.HTTP_200_OK)

class CheckoutView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        
        cart_items = list(db.carts.find({"user_id": user_id}))
        
        if not cart_items:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Enforce KYC
        kyc = db.kyc.find_one({"user_id": user_id})
        if not kyc or kyc.get("status") != "approved":
            return Response({"error": "KYC approval is required before checkout", "requires_kyc": True}, status=status.HTTP_403_FORBIDDEN)
            
        payment_method = request.data.get("payment_method", "UPI_GATEWAY")
        payment_details = request.data.get("payment_details", {})
        
        transaction_id = f"TXN_{uuid.uuid4().hex[:10].upper()}"
        invoice_number = f"INV-{datetime.datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        
        rentals = []
        total_rent = 0.0
        total_deposit = 0.0
        items_summary = []

        now = datetime.datetime.utcnow()
        next_billing = now + datetime.timedelta(days=30)
        
        for item in cart_items:
            app = db.appliances.find_one({"appliance_id": item["appliance_id"]})
            tenure_str = str(item.get("tenure", "3"))
            item_price = 500.0
            item_deposit = 750.0
            rental_name = "Appliance"
            category_id = "Appliance"
            image_url = ""
            
            if app:
                pricing = app.get("pricing", {})
                item_price = float(pricing.get(tenure_str, app.get("monthly_price", 500)))
                item_deposit = float(app.get("security_deposit", round(item_price * 1.5)))
                rental_name = app.get("rental_name", "Appliance")
                category_id = app.get("category_id", "Appliance")
                image_url = app.get("image_url", "")
            else:
                item_deposit = round(item_price * 1.5)

            total_rent += item_price
            total_deposit += item_deposit
            
            rental_id = str(uuid.uuid4())
            rentals.append({
                "_id": rental_id,
                "user_id": user_id,
                "appliance_id": item["appliance_id"],
                "tenure": tenure_str,
                "monthly_rent": item_price,
                "security_deposit": item_deposit,
                "deposit_status": "HELD",
                "amount_paid": float(item_price + item_deposit),
                "transaction_id": transaction_id,
                "invoice_number": invoice_number,
                "payment_method": payment_method,
                "status": "active",
                "rented_at": now,
                "next_billing_date": next_billing
            })

            items_summary.append({
                "rental_id": rental_id,
                "appliance_id": item["appliance_id"],
                "rental_name": rental_name,
                "category_id": category_id,
                "image_url": image_url,
                "tenure": tenure_str,
                "monthly_price": item_price,
                "security_deposit": item_deposit
            })
            
            # Decrease stock
            db.appliances.update_one(
                {"appliance_id": item["appliance_id"]},
                {"$inc": {"stock_quantity": -1}}
            )
            
        tax_amount = round(total_rent * 0.18, 2)
        total_paid = round(total_rent + total_deposit + tax_amount, 2)
        
        user = db.users.find_one({"_id": user_id})
        user_email = user.get("email", "") if user else ""
        user_name = user.get("username", "") if user else ""

        payment_doc = {
            "_id": str(uuid.uuid4()),
            "transaction_id": transaction_id,
            "invoice_number": invoice_number,
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "amount_rent": float(round(total_rent, 2)),
            "amount_deposit": float(round(total_deposit, 2)),
            "amount_tax": float(tax_amount),
            "amount_total": float(total_paid),
            "payment_method": payment_method,
            "payment_details": payment_details,
            "status": "SUCCESS",
            "payment_gateway": "RentAI Pay (Secured Razorpay/UPI Simulator)",
            "created_at": now,
            "rental_ids": [r["_id"] for r in rentals],
            "items_summary": items_summary
        }
        db.payments.insert_one(payment_doc)

        db.rentals.insert_many(rentals)
        db.carts.delete_many({"user_id": user_id})
        
        # Send receipt email
        if user_email:
            item_count = len(rentals)
            try:
                send_mail(
                    subject=f'Your RentAI Order Receipt ({invoice_number})',
                    message=f'Hi {user_name},\n\nYour payment was successful!\nTransaction ID: {transaction_id}\nInvoice: {invoice_number}\nPayment Method: {payment_method}\nTotal Amount Paid: Rs. {total_paid:,.2f} (Includes Rs. {total_deposit:,.2f} refundable deposit)\n\nYou have rented {item_count} item(s). They will be delivered shortly.\n\nThank you for choosing RentAI!\n\nBest,\nThe RentAI Team',
                    from_email='support@rentai.com',
                    recipient_list=[user_email],
                    fail_silently=True,
                )
            except Exception as e:
                print("Failed to send receipt email:", e)
        
        return Response({
            "success": "Checkout successful",
            "rentals_count": len(rentals),
            "transaction_id": transaction_id,
            "invoice_number": invoice_number,
            "total_paid": total_paid,
            "payment": {
                "transaction_id": transaction_id,
                "invoice_number": invoice_number,
                "amount_rent": float(round(total_rent, 2)),
                "amount_deposit": float(round(total_deposit, 2)),
                "amount_tax": float(tax_amount),
                "amount_total": float(total_paid),
                "payment_method": payment_method,
                "status": "SUCCESS",
                "created_at": now.isoformat()
            }
        }, status=status.HTTP_200_OK)

class RentalsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        status_filter = request.query_params.get("status", "active")
        
        query = {"user_id": user_id}
        if status_filter != "all":
            query["status"] = status_filter
            
        rentals = list(db.rentals.find(query).sort("rented_at", -1))
        
        result = []
        for r in rentals:
            app = db.appliances.find_one({"appliance_id": r["appliance_id"]})
            if app:
                app["_id"] = str(app["_id"])
            else:
                app = {
                    "appliance_id": r["appliance_id"],
                    "rental_name": "Appliance",
                    "category_id": "General",
                    "monthly_price": r.get("monthly_rent", 500)
                }
            result.append({
                "rental_id": str(r["_id"]),
                "appliance": app,
                "tenure": r.get("tenure", "3"),
                "status": r.get("status", "active"),
                "monthly_rent": r.get("monthly_rent", app.get("monthly_price", 500)),
                "security_deposit": r.get("security_deposit", 0.0),
                "deposit_status": r.get("deposit_status", "HELD"),
                "deposit_refunded": r.get("deposit_refunded", 0.0),
                "refund_transaction_id": r.get("refund_transaction_id", None),
                "refund_date": r.get("refund_date", None),
                "transaction_id": r.get("transaction_id", None),
                "invoice_number": r.get("invoice_number", None),
                "payment_method": r.get("payment_method", "UPI_GATEWAY"),
                "rented_at": r.get("rented_at"),
                "returned_at": r.get("returned_at"),
                "next_billing_date": r.get("next_billing_date")
            })
                
        return Response(result, status=status.HTTP_200_OK)

    def patch(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        rental_id = request.data.get("rental_id")
        
        if not rental_id:
            return Response({"error": "rental_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        rental = db.rentals.find_one({"_id": rental_id, "user_id": user_id, "status": "active"})
        if not rental:
            return Response({"error": "Active rental not found"}, status=status.HTTP_404_NOT_FOUND)
            
        refund_txn = f"REF_{uuid.uuid4().hex[:10].upper()}"
        now = datetime.datetime.utcnow()
        deposit_amount = float(rental.get("security_deposit", 0.0))
        
        db.rentals.update_one(
            {"_id": rental_id},
            {"$set": {
                "status": "inactive",
                "returned_at": now,
                "deposit_status": "REFUNDED",
                "deposit_refunded": deposit_amount,
                "refund_transaction_id": refund_txn,
                "refund_date": now
            }}
        )
        
        db.appliances.update_one(
            {"appliance_id": rental["appliance_id"]},
            {"$inc": {"stock_quantity": 1}}
        )

        db.refunds.insert_one({
            "_id": str(uuid.uuid4()),
            "refund_transaction_id": refund_txn,
            "rental_id": rental_id,
            "user_id": user_id,
            "appliance_id": rental.get("appliance_id"),
            "refund_amount": deposit_amount,
            "status": "PROCESSED",
            "credited_to": "Original Payment Method",
            "created_at": now
        })
        
        return Response({
            "success": "Rental returned successfully",
            "deposit_refunded": deposit_amount,
            "refund_transaction_id": refund_txn
        }, status=status.HTTP_200_OK)

class PaymentHistoryView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        
        payments = list(db.payments.find({"user_id": user_id}).sort("created_at", -1))
        for p in payments:
            p["_id"] = str(p["_id"])
            if "created_at" in p and isinstance(p["created_at"], datetime.datetime):
                p["created_at"] = p["created_at"].isoformat()
            
        return Response(payments, status=status.HTTP_200_OK)

class PaymentInvoiceView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, transaction_id):
        db = get_mongo_db()
        user_id = request.user.id
        
        payment = db.payments.find_one({"transaction_id": transaction_id, "user_id": user_id})
        if not payment:
            payment = db.payments.find_one({"$or": [{"invoice_number": transaction_id}, {"_id": transaction_id}], "user_id": user_id})
            
        if not payment:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)
            
        payment["_id"] = str(payment["_id"])
        if "created_at" in payment and isinstance(payment["created_at"], datetime.datetime):
            payment["created_at"] = payment["created_at"].isoformat()
            
        return Response(payment, status=status.HTTP_200_OK)

class KYCView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        
        kyc = db.kyc.find_one({"user_id": user_id})
        if not kyc:
            return Response({"status": "pending"}, status=status.HTTP_200_OK)
            
        return Response({
            "status": kyc.get("status", "pending"),
            "submitted_at": kyc.get("submitted_at")
        }, status=status.HTTP_200_OK)
        
    def post(self, request):
        db = get_mongo_db()
        user_id = request.user.id
        
        # Mocking KYC upload - in a real app this would save to S3
        id_proof = request.data.get("id_proof")
        address_proof = request.data.get("address_proof")
        
        if not id_proof or not address_proof:
            return Response({"error": "id_proof and address_proof are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        db.kyc.update_one(
            {"user_id": user_id},
            {"$set": {
                "status": "approved", # Auto-approve for demo purposes
                "id_proof_mock_url": f"mock_url_{uuid.uuid4()}",
                "address_proof_mock_url": f"mock_url_{uuid.uuid4()}",
                "submitted_at": datetime.datetime.utcnow()
            }},
            upsert=True
        )
        return Response({"success": "KYC submitted successfully", "status": "approved"}, status=status.HTTP_200_OK)

class AdminDashboardView(APIView):
    permission_classes = [AllowAny] # Open for demo purposes
    
    def get(self, request):
        db = get_mongo_db()
        
        # Calculate total revenue from rentals stored in MongoDB
        all_rentals = list(db.rentals.find({}))
        total_revenue = sum(float(r.get("amount_paid", 0)) for r in all_rentals)
        
        total_rentals = db.rentals.count_documents({"status": "active"})
        
        # Fetch at-risk scores directly from MongoDB collection user_churn_scores
        at_risk_scores = list(db.user_churn_scores.find({"churn_risk_score": {"$gt": 0.5}}).sort("churn_risk_score", -1))
        
        at_risk_data = []
        for score in at_risk_scores:
            at_risk_data.append({
                "username": score.get("username", "Unknown"),
                "email": score.get("email", ""),
                "churn_risk_score": float(score.get("churn_risk_score", 0)),
                "shap_reason": score.get("shap_reason", "Risk factors detected"),
                "last_updated": score.get("last_updated")
            })
            
        # Fetch store sales analytics ingested from FlipDB/store_sales_data.csv
        sales_doc = db.sales_analytics.find_one({"doc_type": "store_sales_kpi"})
        sales_analytics = {}
        if sales_doc:
            sales_analytics = {
                "dataset_name": sales_doc.get("dataset_name", "store_sales_data.csv"),
                "appliance_furniture_records": sales_doc.get("appliance_furniture_records", 0),
                "total_sales_volume": sales_doc.get("total_sales_volume", 0),
                "total_profit_volume": sales_doc.get("total_profit_volume", 0),
                "avg_order_value": sales_doc.get("avg_order_value", 0),
                "avg_discount_pct": sales_doc.get("avg_discount_pct", 0),
                "categories": sales_doc.get("categories", []),
                "top_states": sales_doc.get("top_states", []),
                "city_tiers": sales_doc.get("city_tiers", []),
                "customer_segments": sales_doc.get("customer_segments", []),
                "recent_transactions": sales_doc.get("recent_transactions", []),
                "last_updated": sales_doc.get("last_updated")
            }

        return Response({
            "total_revenue": float(total_revenue),
            "active_rentals": total_rentals,
            "at_risk_customers": at_risk_data,
            "sales_analytics": sales_analytics
        }, status=status.HTTP_200_OK)
