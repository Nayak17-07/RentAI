# UML Documentation
## Project: RentAI – Smart Appliance Rental Platform
**Standard**: Unified Modeling Language (UML 2.5)  
**Version**: 1.0.0  

---

## 1. Introduction

This document formalizes the object-oriented and structural models of the **RentAI** system using standard UML 2.5 notation rendered via interactive Mermaid diagrams. The models encompass functional behavioral views (Use Case, Sequence, Activity, State) and structural engineering views (Class, Component).

---

## 2. Use Case Diagram

The Use Case model defines the functional interactions between system actors (Unregistered Visitor, Registered Customer, System Administrator) and the platform boundaries.

```mermaid
graph LR
    subgraph Actors
        V[Visitor]
        C[Registered Customer]
        A[System Administrator]
    end

    subgraph RentAI Platform Boundaries
        UC1(Browse Appliance Catalog)
        UC2(Filter by City & Category)
        UC3(Register & Authenticate)
        UC4(Upload KYC Verification)
        UC5(Configure Rental Tenure 3/6/12m)
        UC6(Manage Persistent Cart)
        UC7(Execute Lease Checkout)
        UC8(View Active Contracts)
        UC9(Initiate Asset Return)
        UC10(View Recommendation Feed)
        UC11(Inspect Churn Risk & SHAP Reasons)
        UC12(Manage Catalog Inventory)
        UC13(Trigger Asynchronous ML ETL)
    end

    V --> UC1
    V --> UC2
    V --> UC3

    C --> UC1
    C --> UC2
    C --> UC4
    C --> UC5
    C --> UC6
    C --> UC7
    C --> UC8
    C --> UC9
    C --> UC10

    A --> UC11
    A --> UC12
    A --> UC13
```

---

## 3. Class Diagram

The Class Diagram illustrates the structural entities, attributes, methods, and relational multiplicities within the system.

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String email
        +String password_hash
        +String phone_num
        +String role
        +DateTime date_joined
        +register()
        +authenticate()
        +update_profile()
    }

    class Appliance {
        +UUID appliance_id
        +String category_id
        +String rental_name
        +Decimal daily_price
        +Integer stock_quantity
        +List available_cities
        +Map tenure_pricing
        +String description
        +List image_urls
        +check_availability(city)
        +decrement_stock()
        +increment_stock()
    }

    class Cart {
        +UUID cart_id
        +UUID user_id
        +List items
        +DateTime updated_at
        +add_item(appliance_id, tenure)
        +remove_item(appliance_id)
        +clear()
    }

    class Rental {
        +UUID rental_id
        +UUID user_id
        +UUID appliance_id
        +DateTime rental_start_date
        +DateTime rental_end_date
        +Integer tenure_months
        +Decimal monthly_fee
        +String status
        +create_contract()
        +process_return()
        +mark_overdue()
    }

    class PaymentReturn {
        +UUID payment_id
        +UUID rental_id
        +Decimal amount_paid
        +String payment_method
        +String return_status
        +DateTime timestamp
        +record_transaction()
    }

    class UserChurnScore {
        +UUID user_id
        +Float churn_risk_score
        +String shap_reason
        +DateTime last_updated
        +compute_risk()
        +generate_explanation()
    }

    class ApplianceRecommendation {
        +UUID recommendation_id
        +UUID user_id
        +UUID recommended_appliance_id
        +Float similarity_score
        +DateTime last_updated
        +get_top_matches(user_id)
    }

    User "1" -- "0..*" Rental : holds
    User "1" -- "1" Cart : owns
    User "1" -- "1" UserChurnScore : evaluated_as
    User "1" -- "0..*" ApplianceRecommendation : receives
    Appliance "1" -- "0..*" Rental : leased_under
    Rental "1" -- "1..*" PaymentReturn : records
    Appliance "1" -- "0..*" ApplianceRecommendation : targeted_in
```

---

## 4. Sequence Diagrams

### 4.1 Sequence Diagram 1: User Authentication & JWT Acquisition

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as React Client (SPA)
    participant BE as Django REST API (/token/)
    participant DB as MongoDB (users collection)

    Customer->>FE: Enters email and password
    FE->>BE: POST /api/token/ {email, password}
    BE->>DB: find_one({email})
    DB-->>BE: Returns user document with password_hash
    BE->>BE: Verify PBKDF2 SHA-256 hash match
    alt Credentials Valid
        BE->>BE: Generate Access Token (15m) & Refresh Token (7d)
        BE-->>FE: 200 OK {access, refresh, user_info}
        FE->>FE: Store token in memory / LocalStorage
        FE-->>Customer: Redirects to Home Dashboard
    else Invalid Credentials
        BE-->>FE: 401 Unauthorized {detail: "Invalid credentials"}
        FE-->>Customer: Display error message
    end
```

### 4.2 Sequence Diagram 2: Cart Checkout & Contract Generation

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as React Client
    participant CheckoutView as Django CheckoutView
    participant DB as MongoDB

    Customer->>FE: Clicks "Confirm & Lease Now"
    FE->>CheckoutView: POST /api/checkout/ (Bearer JWT, {cart_items, tenure})
    CheckoutView->>DB: Check stock_quantity for items
    DB-->>CheckoutView: stock_quantity >= 1
    CheckoutView->>DB: Update appliance { $inc: { stock_quantity: -1 } }
    CheckoutView->>DB: Insert rental document {user_id, appliance_id, status: "ACTIVE", tenure}
    CheckoutView->>DB: Clear user cart collection
    CheckoutView-->>FE: 201 Created {rental_id, status: "ACTIVE", receipt}
    FE-->>Customer: Displays Booking Success & Delivery Timeline
```

---

## 5. Activity Diagram: Customer Rental Lifecycle

```mermaid
stateDiagram-v2
    [*] --> BrowseCatalog : Customer visits platform
    BrowseCatalog --> SelectCity : Choose city (e.g., Bangalore)
    SelectCity --> FilterCategory : Filter by Appliance Category
    FilterCategory --> ViewApplianceDetails : Select product
    ViewApplianceDetails --> ChooseTenure : Pick 3, 6, or 12 months
    ChooseTenure --> AddToCart : Add to Cart
    AddToCart --> AuthenticateUser : Proceed to Checkout
    
    state AuthenticateUser <<choice>>
    AuthenticateUser --> LoginRegister : Not logged in
    LoginRegister --> AuthenticateUser
    AuthenticateUser --> CompleteKYC : Logged in, KYC missing
    CompleteKYC --> ValidateStock : KYC Verified
    AuthenticateUser --> ValidateStock : Logged in, KYC Verified

    state ValidateStock <<choice>>
    ValidateStock --> OutOfStock : Stock == 0
    OutOfStock --> BrowseCatalog : Select alternative
    ValidateStock --> ProcessPayment : Stock >= 1

    ProcessPayment --> LeaseActive : Deduct stock & Create Contract
    LeaseActive --> ContractExecution : Monthly recurring billing
    
    state ContractExecution <<choice>>
    ContractExecution --> ExtendTenure : Request tenure renewal
    ExtendTenure --> LeaseActive
    ContractExecution --> InitiateReturn : Request scheduled return
    
    InitiateReturn --> InspectAsset : Logistics pickup & inspection
    InspectAsset --> RestockInventory : Increment stock_quantity
    RestockInventory --> [*] : Contract Closed
```

---

## 6. State Machine Diagram: Rental Contract States

```mermaid
stateDiagram-v2
    [*] --> PENDING : Checkout initiated
    PENDING --> ACTIVE : Stock reserved & Payment confirmed
    PENDING --> CANCELLED : Payment failed or cancelled
    
    ACTIVE --> RETURN_REQUESTED : Customer requests pickup
    ACTIVE --> OVERDUE : Tenure expired without return/renewal
    OVERDUE --> RETURN_REQUESTED : Asset recovered
    
    RETURN_REQUESTED --> INSPECTING : Logistics transit & physical inspection
    INSPECTING --> DAMAGED : Damage assessment & penalty
    INSPECTING --> RETURNED : Asset verified intact
    DAMAGED --> RETURNED : Penalty settled
    
    RETURNED --> CLOSED : Stock incremented in MongoDB
    CLOSED --> [*]
    CANCELLED --> [*]
```

---

## 7. Component Diagram

```mermaid
graph TD
    subgraph UIComponent [Presentation Component]
        Nav[Navigation Bar & City Selector]
        CatalogUI[Catalog & Tenure Matrix View]
        CartUI[Cart Drawer & Checkout Modal]
        AdminUI[Admin Retention Dashboard]
    end

    subgraph APIComponent [Backend Services Component]
        AuthSvc[Auth & JWT Service]
        CatalogSvc[Catalog & Inventory Service]
        BookingSvc[Rental Engine Service]
        AdminSvc[Executive Dashboard Service]
    end

    subgraph MLComponent [Intelligence Component]
        ETLSvc[Behavioral ETL Extractor]
        ChurnSvc[LightGBM Inference Service]
        RecSvc[TF-IDF Cosine Matcher]
    end

    subgraph PersistenceComponent [Data Persistence Component]
        MongoCluster[(MongoDB Replica Set)]
    end

    UIComponent -->|REST / JSON| APIComponent
    APIComponent -->|PyMongo CRUD| PersistenceComponent
    MLComponent -->|Batch Query| PersistenceComponent
    MLComponent -->|Write Predictions| PersistenceComponent
```
