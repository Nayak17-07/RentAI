# SDC-II Project Architecture: RentAI System

This document formalizes the system architecture and module breakdown for the RentAI platform, developed for the SDC-II project. The architecture is cleanly divided into 8 distinct, highly cohesive development modules built on a **unified, high-performance MongoDB NoSQL architecture** and asynchronous Machine Learning pipelines.

---

## 1. User Authentication & Profile Management
* **Functionality**: Handles customer registration, secure login sessions, and account modifications.
* **Security & Tokens**: Secures passwords using Django's native cryptographic hashing algorithms and issues custom JWT access & refresh tokens.
* **Data Layer**: Interacts directly with the MongoDB `users` collection, storing user identities, contact credentials, and authorization roles.

## 2. Appliance Inventory Management
* **Functionality**: Serves as the master catalog for adding, updating, checking stock, and managing rental inventory across various cities.
* **Data Layer**: Stored in the MongoDB `appliances` collection. Accommodates rich, flexible schemas including dynamic tenure pricing (`3`, `6`, `12` months), security deposits, available cities, high-resolution image URLs, and full specifications without rigid relational table constraints.

## 3. Rental & Booking Engine
* **Functionality**: The core operational workflow allowing customers to browse inventory, configure rental tenures, and initiate active contracts.
* **Data Layer**: Writes real-time transaction data directly into the MongoDB `rentals` collection, capturing rental tenure, billing cycles, item amount paid, and live contract statuses.

## 4. Payment & Asset Return Processing
* **Functionality**: Tracks payments, rental fees, and logs the physical return of appliances at contract completion.
* **Data Layer**: Updates contract states in the MongoDB `rentals` collection (e.g. `returned_at`, active/inactive flags) and restores appliance inventory stock quantities in real time.

## 5. Machine Learning Data Pipeline (ETL)
* **Functionality**: An asynchronous Python pipeline ([etl_pipeline.py](file:///c:/Users/dhran/Desktop/RentAI/ml_pipeline/etl_pipeline.py)) that extracts behavioral and transaction data from MongoDB collections (`users`, `rentals`, `carts`).
* **Processing**: Prepares operational metrics and updates the AI inference layer asynchronously, ensuring live database performance is never compromised by analytical computing.

## 6. Churn Prediction Engine (AI Model 1)
* **Functionality**: Implements the **LightGBM (Light Gradient Boosting Machine)** algorithm to predict the probability of customer churn ($0.0$ to $1.0$).
* **Explainability**: Generates **SHAP reason codes** (e.g., *"3 late payments in last 6 months"*, *"Decreased platform engagement"*) to explain why specific users are at risk.
* **Data Layer**: Writes predictions directly to the MongoDB `user_churn_scores` collection for instant, sub-second retrieval by the operational system.

## 7. Collaborative Recommendation Engine (AI Model 2)
* **Functionality**: Uses **TF-IDF Vectorization** and **Cosine Similarity** ([train_model.py](file:///c:/Users/dhran/Desktop/RentAI/ml_pipeline/train_model.py)) to map mathematical similarities between customer rental history and catalog attributes.
* **Data Layer**: Writes personalized top-ranked matches into the MongoDB `appliance_recommendations` collection. The frontend renders the "Recommended for You" section with zero computational delay.

## 8. Admin Analytics Dashboard
* **Functionality**: A secure dashboard interface built for customer retention teams and platform administrators.
* **Integration**: Queries pre-computed collections (`user_churn_scores` and `rentals`) directly from MongoDB to display live revenue, active rentals, and high-risk customers with plain-language SHAP actionable insights.
