# REST API Specification
## Project: Rentora – Smart Appliance Rental Platform
**Standard**: OpenAPI 3.0 Compatible REST Specification  
**Base URL**: `http://127.0.0.1:8000/api`  
**Authentication Scheme**: HTTP Bearer JWT (`Authorization: Bearer <token>`)  
**Version**: 1.0.0  

---

## 1. Global API Standards and Error Handling

### 1.1 Request Headers
All mutating API calls (`POST`, `PUT`, `PATCH`, `DELETE`) require:
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT_ACCESS_TOKEN>  (for protected routes)
```

### 1.2 Standard Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Payload validation error.
- `401 Unauthorized`: Missing or expired JWT token.
- `403 Forbidden`: Insufficient role permissions (e.g. non-admin accessing admin dashboard).
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Business constraint violation (e.g. out of stock or email already exists).
- `500 Internal Server Error`: Unhandled server exception.

### 1.3 Uniform Error Schema
```json
{
  "error": "Error identifier",
  "detail": "Detailed explanation of the failure condition."
}
```

---

## 2. Authentication & Identity Endpoints

### 2.1 User Registration
- **Endpoint**: `POST /api/users/`
- **Access**: Public
- **Description**: Creates a new user profile in MongoDB with salted and hashed credentials.

#### Request Body
```json
{
  "username": "alex_morgan",
  "email": "alex.morgan@example.com",
  "password": "SecurePassword123!",
  "phone_num": "9876543210",
  "role": "customer"
}
```

#### Response: `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "c71a39d8-9411-41b8-831e-45012a9e8891",
    "username": "alex_morgan",
    "email": "alex.morgan@example.com",
    "role": "customer"
  }
}
```

---

### 2.2 Token Authentication (Login)
- **Endpoint**: `POST /api/token/`
- **Access**: Public
- **Description**: Authenticates user credentials and issues a JSON Web Token pair.

#### Request Body
```json
{
  "email": "alex.morgan@example.com",
  "password": "SecurePassword123!"
}
```

#### Response: `200 OK`
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c71a39d8-9411-41b8-831e-45012a9e8891",
    "username": "alex_morgan",
    "email": "alex.morgan@example.com",
    "role": "customer"
  }
}
```

---

### 2.3 Token Refresh
- **Endpoint**: `POST /api/token/refresh/`
- **Access**: Public (requires valid refresh token)
- **Description**: Issues a fresh short-lived access token using a valid long-lived refresh token.

#### Request Body
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response: `200 OK`
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. Appliance Catalog & Inventory Endpoints

### 3.1 List and Filter Appliances
- **Endpoint**: `GET /api/appliances/`
- **Access**: Public
- **Query Parameters**:
  - `city` *(string, optional)*: Filter by target city (e.g. `Bangalore`, `Mumbai`).
  - `category` *(string, optional)*: Filter by category (e.g. `refrigerators`, `washing_machines`).
  - `search` *(string, optional)*: Search keyword.

#### Response: `200 OK`
```json
[
  {
    "appliance_id": "b304e287-21a1-4322-901d-5b3ea7129598",
    "rental_name": "Samsung 253L Double Door Refrigerator",
    "category_id": "refrigerators",
    "daily_price": 28.50,
    "stock_quantity": 8,
    "available_cities": ["Bangalore", "Mumbai", "Hyderabad"],
    "tenure_pricing": {
      "3": { "monthly_price": 855.00, "deposit": 1500.00 },
      "6": { "monthly_price": 750.00, "deposit": 1200.00 },
      "12": { "monthly_price": 620.00, "deposit": 1000.00 }
    },
    "images": ["https://images.rentora.com/ref1.webp"]
  }
]
```

---

## 4. Recommendations & Intelligence Endpoints

### 4.1 Personalized Recommendations
- **Endpoint**: `GET /api/recommendations/`
- **Access**: Authenticated (`Bearer <token>`)
- **Description**: Returns top personalized recommendations matching user rental history and cross-category affinities.

#### Response: `200 OK`
```json
[
  {
    "appliance_id": "90d19ca2-4322-411a-8291-a128e4019283",
    "rental_name": "LG 28L Convection Microwave Oven",
    "category_id": "microwaves",
    "similarity_score": 0.884,
    "monthly_price": 420.00,
    "images": ["https://images.rentora.com/micro1.webp"]
  }
]
```

---

## 5. Cart & Multi-Tenure Booking Endpoints

### 5.1 Retrieve and Update Cart
- **Endpoint**: `GET /api/cart/`, `POST /api/cart/`
- **Access**: Authenticated

#### POST Request Body (Add to Cart)
```json
{
  "appliance_id": "b304e287-21a1-4322-901d-5b3ea7129598",
  "tenure_months": 6
}
```

#### Response: `200 OK`
```json
{
  "cart_id": "8f3918a2-1111-4444-9999-123456789abc",
  "items_count": 1,
  "items": [
    {
      "appliance_id": "b304e287-21a1-4322-901d-5b3ea7129598",
      "rental_name": "Samsung 253L Double Door Refrigerator",
      "tenure_months": 6,
      "monthly_fee": 750.00,
      "deposit": 1200.00
    }
  ]
}
```

---

### 5.2 Checkout & Contract Finalization
- **Endpoint**: `POST /api/checkout/`
- **Access**: Authenticated
- **Description**: Atomically validates stock, decrements quantity, and creates active rental contracts.

#### Request Body
```json
{
  "delivery_address": {
    "street": "14th Main Road",
    "city": "Bangalore",
    "postal_code": "560102"
  },
  "payment_method": "UPI_GATEWAY"
}
```

#### Response: `201 Created`
```json
{
  "status": "SUCCESS",
  "message": "Rental contract created successfully",
  "rentals": [
    {
      "rental_id": "7a3019cf-b7c1-419b-a359-5431cb30129a",
      "appliance_id": "b304e287-21a1-4322-901d-5b3ea7129598",
      "rental_name": "Samsung 253L Double Door Refrigerator",
      "rental_start_date": "2026-03-22",
      "rental_end_date": "2026-09-22",
      "tenure_months": 6,
      "monthly_fee": 750.00,
      "status": "ACTIVE"
    }
  ]
}
```

---

## 6. Rentals Lifecycle & Return Endpoints

### 6.1 View User Rentals
- **Endpoint**: `GET /api/rentals/`
- **Access**: Authenticated
- **Description**: Lists all active and historical rental contracts for the calling user.

### 6.2 Process Return
- **Endpoint**: `POST /api/rentals/`
- **Access**: Authenticated
- **Description**: Updates contract status to `RETURNED` and replenishes appliance stock in MongoDB.

#### Request Body
```json
{
  "rental_id": "7a3019cf-b7c1-419b-a359-5431cb30129a",
  "action": "RETURN"
}
```

#### Response: `200 OK`
```json
{
  "message": "Appliance return processed successfully. Stock replenished.",
  "rental_id": "7a3019cf-b7c1-419b-a359-5431cb30129a",
  "status": "RETURNED"
}
```

---

## 7. Executive Admin Analytics Endpoint

### 7.1 Admin Overview and Churn Control Center
- **Endpoint**: `GET /api/admin/dashboard/`
- **Access**: Restricted (`role == "admin"`)
- **Description**: Aggregates revenue, active lease counts, and delivers high-risk customer records with interpretable SHAP reason codes.

#### Response: `200 OK`
```json
{
  "overview": {
    "total_users": 1420,
    "active_rentals": 834,
    "monthly_recurring_revenue": 625500.00,
    "high_risk_churn_count": 48
  },
  "high_risk_customers": [
    {
      "user_id": "e4b105a2-9f17-48f8-821b-cfc1901a1c92",
      "username": "sarah_tech",
      "email": "sarah.tech@example.com",
      "churn_risk_score": 0.7420,
      "risk_level": "CRITICAL",
      "shap_reason": "3 late payments in last 6 months; 24 days without app activity"
    }
  ]
}
```
