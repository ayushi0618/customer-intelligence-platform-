# Customer Intelligence & Marketing Analytics Platform

An end-to-end, production-grade enterprise **Customer Intelligence & Marketing Analytics Platform** incorporating Customer 360 profiles, RFM Customer Segmentation, predictive Machine Learning microservices (Churn Prediction & Customer Lifetime Value), Multi-Touch Attribution, Explainable Recommendation Engine, and an Executive Business Intelligence Dashboard.

---

## 🌟 Key Highlights & Core Capabilities

- **100% Real Relational SQL Database:** Powered by MySQL 8.0 with 28 fully normalized tables, composite indexes, foreign key constraints, and 0 mock data.
- **Reproducible Synthetic Data Generator:** 10,000 realistic customer profiles generating 42,000+ orders, 109,000+ line items, 209,000+ web/mobile telemetry events, 120,000+ marketing campaign touchpoints, and 7,000+ customer support interactions created using a deterministic Mulberry32 seed (`seed=42`).
- **Real-Time Express REST API Gateway:** Layered MVC architecture (`controllers`, `services`, `repositories`, `middleware`) enforcing JWT Authentication, Role-Based Access Control (Admin, Analyst, Manager, Marketer), rate limiting, and SQL injection prevention.
- **Leakage-Safe Machine Learning Microservice:** Python 3.12 + FastAPI microservice with Scikit-Learn pipelines:
  - **RFM Customer Segmentation:** K-Means Clustering (`k=5`) with `StandardScaler` & Silhouette Score optimization.
  - **Predictive Churn Risk:** `RandomForestClassifier` with temporal feature engineering (90-day forward window, 0 target leakage) achieving **ROC-AUC 0.9761** and **PR-AUC 0.9904**.
  - **Customer Lifetime Value (CLV) Forecasting:** `RandomForestRegressor` predicting 90-day forward spend achieving **R² 0.5842**.
- **Rule-Based Explainable Recommendation Engine:** Dynamic business rule engine translating RFM segments, predicted churn risk, and CLV metrics into actionable marketing strategies (e.g., VIP retention, win-back discounts, cross-sell campaigns) with executable status lifecycle management (`pending`, `in_progress`, `completed`, `dismissed`).
- **Advanced Multi-Touch Attribution Engine:** Calculates and compares First-Touch, Last-Touch, and Linear Multi-Touch attribution models across marketing channels.
- **Modern Executive BI Dashboard UI:** Responsive React 18 SPA built with Vite, Tailwind CSS, Recharts visual analytics, glassmorphic dark mode palette, and interactive Customer 360 drawers.

---

## 🏗️ Architecture & Technology Stack

```
                                  +-----------------------+
                                  |   React 18 / Vite     |
                                  | Executive BI Dashboard|
                                  +-----------+-----------+
                                              |
                                              | REST API (JWT Auth)
                                              v
                                  +-----------------------+
                                  | Node.js / Express Gateway|
                                  | (Controllers/Services)|
                                  +-----+-----------+-----+
                                        |           |
                     SQL Queries (Pool) |           | HTTP (FastAPI Client)
                                        v           v
          +-------------------------------+       +-------------------------------+
          |         MySQL 8.0             |       | Python 3.12 / FastAPI         |
          |  (28 Tables Relational Engine)|       | Machine Learning Microservice |
          +-------------------------------+       +-------------------------------+
```

| Layer | Technology Stack |
| :--- | :--- |
| **Database** | MySQL 8.0 (InnoDB, FK Constraints, Composite Indexes) |
| **Backend API Gateway** | Node.js (v18+), Express.js v4, MySQL2, JWT, Bcrypt.js, Jest |
| **ML Microservice** | Python 3.12, FastAPI, Scikit-Learn, Pandas, NumPy, Joblib, Uvicorn |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Recharts, Axios, Lucide React Icons |
| **DevOps & Containers** | Docker, Docker-Compose |

---

## 🗄️ Database Schema & Data Engine

The system is built on **28 normalized relational tables**:

- **Customer & Profiles:** `customers`, `customer_demographics`, `customer_addresses`, `customer_preferences`
- **Orders & E-Commerce:** `orders`, `order_items`, `products`, `product_categories`, `payments`, `shipping_details`
- **Digital Telemetry:** `website_sessions`, `website_events`, `mobile_app_events`
- **Marketing & Campaigns:** `marketing_campaigns`, `campaign_channels`, `campaign_touchpoints`, `email_events`, `ad_clicks`
- **Support & Service:** `support_tickets`, `support_interactions`, `customer_reviews`
- **Analytics & Precomputed Intelligence:** `rfm_scores`, `rfm_segments`, `attribution_results`, `ml_predictions`, `ml_model_metadata`, `recommendations`, `users`

---

## 🧠 Machine Learning Engine Architecture

### 1. Leakage-Safe Temporal Windowing
```
[---------------- HISTORICAL OBSERVATION WINDOW ---------------->] | [--- FORWARD PREDICTION WINDOW --->]
<------------------ T_minus_180 to T_cutoff --------------------> | <------- T_cutoff to T_plus_90 ---->
                         FEATURE STORE                            |             TARGET LABELS
  - Recency, Frequency, Monetary, AOV                            | Churn Label: 1 if Orders == 0 else 0
  - Web & Mobile Sessions, Cart Abandon Rate                     | CLV Target: Sum of forward spend
  - Campaign Click Rates, Open Support Tickets                   |
```

### 2. Model Performance Summary
- **RFM Segmentation (K-Means):** Identifies 5 segments (*Champions, Loyal, At-Risk, Hibernating, New Customers*).
- **Churn Classifier (Random Forest):** 
  - **ROC-AUC:** `0.9761`
  - **PR-AUC:** `0.9904`
  - Risk Stratification: Low ($P < 0.35$), Medium ($0.35 \le P < 0.70$), High ($P \ge 0.70$).
- **CLV Regressor (Random Forest):**
  - **R² Score:** `0.5842`

---

## 🔌 REST API Endpoints Overview

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and issue JWT token.
- `GET /api/auth/me` — Return current logged-in user profile & role.

### Customer Intelligence (`/api/customers`)
- `GET /api/customers` — Paginated customer list with filters (`search`, `segment`, `churnRisk`, `channel`).
- `GET /api/customers/:id` — Single customer profile details.
- `GET /api/customers/:id/360` — Comprehensive 360 view uniting order history, web activity, support tickets, and ML scores.

### Analytics & Segmentation (`/api/analytics`, `/api/rfm`, `/api/funnel`)
- `GET /api/analytics/dashboard/summary` — Executive KPI metrics (Total Revenue, Active Customers, AOV, Churn Rate).
- `GET /api/rfm/summary` — RFM segment breakdown and monetary distribution.
- `GET /api/funnel/summary` — Multi-stage conversion funnel analytics.

### Multi-Touch Attribution & Campaigns (`/api/attribution`, `/api/campaigns`)
- `GET /api/attribution/comparison` — Compare First-Touch, Last-Touch, and Linear models.
- `GET /api/campaigns` — Campaign performance metrics and channel ROI.

### Machine Learning & Recommendations (`/api/ml`, `/api/recommendations`)
- `GET /api/ml/models` — Active ML model metrics and training timestamps.
- `POST /api/ml/predict/churn` — Real-time churn prediction for a customer feature vector.
- `GET /api/recommendations` — Actionable marketing recommendations with lifecycle status (`pending`, `in_progress`, `completed`, `dismissed`).
- `PATCH /api/recommendations/:id/status` — Update recommendation lifecycle state.

---

## 📁 Repository Structure

```
analytics/
├── .env.example                     # Environment template
├── docker-compose.yml               # Multi-container setup (MySQL, Express, FastAPI, React)
├── README.md                        # Master system guide
├── database/
│   ├── migrations/                  # DDL script for all 28 tables
│   ├── seeds/                       # Seed data generator (10,000 customers)
│   └── scripts/                     # Migration, seeding, validation & pre-computation scripts
├── backend/
│   ├── src/                         # Express controllers, services, repositories, middleware
│   └── tests/                       # Jest test suite (auth, API endpoints)
├── ml-service/
│   ├── run_training.py              # ML pipeline training script
│   └── app/                         # FastAPI application, features, and ML models
└── frontend/
    └── src/                         # React 18 BI Dashboard components & pages
```

---

## 🚀 Quickstart Guide

### 1. Environment Setup
Copy `.env.example` to `.env` and verify database configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=customer_intelligence
JWT_SECRET=super_secret_jwt_key_2026
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

### 2. Database Setup & Seeding
```bash
# Install dependencies
npm install

# Run database schema migration
node database/scripts/migrate.js

# Seed database with 10,000 customers & telemetry records
node database/scripts/seed.js

# Verify database integrity (0 orphans)
node database/scripts/validate_data.js

# Pre-compute RFM scores, Attribution, and Recommendations
node database/scripts/init_analytics.js
```

### 3. Machine Learning Microservice Setup
```bash
cd ml-service
python -m venv venv
.\venv\Scripts\activate      # Windows (or 'source venv/bin/activate' on Unix)
pip install -r requirements.txt

# Train K-Means, Churn Random Forest, and CLV Regressor
python run_training.py

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Express Backend API Setup
```bash
cd backend
npm install
npm run dev                  # Starts server on http://localhost:5000
```

### 5. React Frontend Web App Setup
```bash
cd frontend
npm install
npm run dev                  # Starts Vite UI on http://localhost:5173
```

---

## 🔒 Demo Authentication Credentials

Login with any of these pre-configured roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@system.local` | `Admin@123` | Full access + Recalculate RFM |
| **Analyst** | `analyst@system.local` | `Analyst@123` | View BI Dashboards, ML Models, Attribution |
| **Marketer** | `marketer@system.local` | `Marketer@123` | View Campaigns, RFM, Execute Recommendations |
| **Manager** | `manager@system.local` | `Manager@123` | Executive Overview & Report Exporting |

---

## 🧪 Testing & Verification

```bash
# Run Backend Jest Unit & Integration Tests (15/15 passing)
cd backend
npm test

# Run Data Integrity Verification Script
node database/scripts/validate_data.js
```

---

## 📜 License
Developed as an Academic Full-Stack Customer Intelligence & Data Engineering Project. All dataset profiles are synthetic and GDPR/CCPA compliant.
