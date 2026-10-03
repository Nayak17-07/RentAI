# Master Test Plan
## Project: Rentora – Smart Appliance Rental Platform
**Standard**: IEEE Std 829-2008 (Test Documentation)  
**Version**: 1.0.0  

---

## 1. Introduction and Objectives

The primary objective of this Test Plan is to define the testing scope, methodology, resources, and schedule for verifying and validating the **Rentora** system. The plan ensures that all functional, performance, security, and machine learning components satisfy their requirements prior to general release.

---

## 2. Test Strategy and Methodologies

```mermaid
graph TD
    subgraph TestingPyramid [Testing Pyramid Strategy]
        E2E[End-to-End System & API Verification (test_all_modules_fast.py)]
        INT[Integration & Contract Tests (DRF Views + PyMongo)]
        UNIT[Unit Tests (Password Hasher, Token Gen, Tenure Calculator)]
        MLTEST[ML Validation Suite (evaluate_models.py: F1, ROC-AUC)]
    end
```

### 2.1 Testing Levels
1. **Unit Testing**: Tests isolated functions, utility modules, and mathematical formulations (e.g. tenure discounts, date calculations).
2. **Integration Testing**: Validates interactions between Django REST endpoints, custom JWT authenticators, and the MongoDB NoSQL database.
3. **End-to-End (E2E) System Testing**: Executes complete transaction paths from user onboarding, cart assembly, checkout, and inventory decrement, to asset return and restocking.
4. **Machine Learning Model Validation**: Evaluates classification accuracy, ROC-AUC, confusion matrices, and SHAP reason attribution validity.

---

## 3. Test Cases Specification

| Test ID | Module / Area | Test Objective | Pre-conditions | Expected Result | Priority |
|---|---|---|---|---|---|
| **TC-SYS-01** | System Health | Verify Vite client (`:5173`) and Django API (`:8000`) reachability | Services launched | HTTP 200 OK received within 3000ms | High |
| **TC-AUTH-01** | Authentication | Register user with unique email and valid password | Unused email | User created, password hashed with PBKDF2, HTTP 201 | High |
| **TC-AUTH-02** | Authentication | Obtain JWT token pair with valid credentials | User registered | Access (15m) and Refresh (7d) tokens issued, HTTP 200 | High |
| **TC-AUTH-03** | Authentication | Attempt authentication with invalid password | User registered | HTTP 401 Unauthorized with descriptive error | High |
| **TC-CAT-01** | Catalog | Query appliances filtered by `city=Bangalore` | Catalog seeded | Only appliances with Bangalore in `available_cities` returned | High |
| **TC-CAT-02** | Catalog | Query appliances filtered by `category_id=refrigerators` | Catalog seeded | Only refrigerators returned | Medium |
| **TC-CART-01** | Cart | Add item to cart specifying 6-month tenure | User authenticated | Item added with corresponding 6-month monthly fee | High |
| **TC-CHK-01** | Checkout | Execute checkout on in-stock item | Item in cart, stock $\ge 1$ | Rental created with status `ACTIVE`, stock decremented by 1 | Critical |
| **TC-CHK-02** | Checkout | Attempt checkout on out-of-stock item | Stock $= 0$ | Checkout rejected with HTTP 409 Conflict | Critical |
| **TC-RET-01** | Asset Return | Initiate return for active rental | Rental in `ACTIVE` state | Status changed to `RETURNED`, stock incremented by 1 | High |
| **TC-ML-01** | Churn Model | Train LightGBM model on customer behavioral dataset | Dataset available | Test ROC-AUC $\ge 0.85$, $F_1 \ge 0.80$ | High |
| **TC-ML-02** | XAI Engine | Verify SHAP reason generation for high-risk user | Churn score $> 0.60$ | Non-empty plain-English SHAP explanation returned | High |
| **TC-ADM-01** | Admin Portal | Query dashboard with admin JWT | Admin user | Summary metrics and high-risk customer list returned | High |
| **TC-ADM-02** | Admin Portal | Attempt dashboard access with customer JWT | Customer user | HTTP 403 Forbidden | High |

---

## 4. Test Environment and Automation Harness

### 4.1 Automated Harness: `test_all_modules_fast.py`
The Rentora system provides a consolidated end-to-end verification script ([test_all_modules_fast.py](file:///c:/Users/dhran/Desktop/Rentora/test_all_modules_fast.py)) that executes all 9 critical module checkpoints synchronously against running servers.

```bash
# Execute automated full-system verification
python test_all_modules_fast.py
```

### 4.2 Machine Learning Benchmark Harness: `evaluate_models.py`
The ML evaluation script assesses LightGBM vs. Random Forest baselines across 1,500 synthetic customer behavior instances:

```bash
# Execute ML evaluation suite
python ml_pipeline/evaluate_models.py
```

---

## 5. Pass / Fail and Release Criteria

The system qualifies for deployment only when:
1. **$100\%$ of Critical and High priority test cases pass**.
2. **Zero database inconsistency defects** (e.g. negative stock counts or orphaned rental records).
3. **ML Performance Thresholds met**:
   - Churn Model: $\text{ROC-AUC} \ge 0.85$, $F_1 \ge 0.80$.
   - Latency: Average API response $\le 150\text{ ms}$.
