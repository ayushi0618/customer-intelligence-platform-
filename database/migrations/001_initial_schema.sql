-- ====================================================================
-- MIGRATION: 001_initial_schema.sql
-- MULTI-CHANNEL CUSTOMER BEHAVIOUR & MARKETING INTELLIGENCE SYSTEM
-- Target Database: MySQL 8 (InnoDB, utf8mb4)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. AUTHENTICATION & RBAC DOMAIN
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CUSTOMER DOMAIN
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    gender ENUM('MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'UNDISCLOSED') DEFAULT 'UNDISCLOSED',
    date_of_birth DATE NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    postal_code VARCHAR(20) NULL,
    acquisition_channel VARCHAR(50) NOT NULL,
    preferred_channel VARCHAR(50) NOT NULL DEFAULT 'Website',
    status ENUM('ACTIVE', 'INACTIVE', 'DORMANT', 'CHURNED') DEFAULT 'ACTIVE',
    registration_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cust_reg_date (registration_date),
    INDEX idx_cust_acq_channel (acquisition_channel),
    INDEX idx_cust_status (status),
    INDEX idx_cust_city_country (country, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    address_type ENUM('SHIPPING', 'BILLING') NOT NULL DEFAULT 'SHIPPING',
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_addr_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_preferences (
    customer_id BIGINT UNSIGNED PRIMARY KEY,
    email_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    sms_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    push_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_language VARCHAR(10) DEFAULT 'en-US',
    interest_categories JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PRODUCTS DOMAIN
CREATE TABLE IF NOT EXISTS product_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    sku VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(12,2) NOT NULL CHECK (price >= 0.00),
    cost DECIMAL(12,2) NOT NULL CHECK (cost >= 0.00),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT,
    INDEX idx_products_category (category_id),
    INDEX idx_products_sku (sku),
    INDEX idx_products_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TRANSACTIONS DOMAIN
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    order_date DATETIME NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'DELIVERED',
    channel ENUM('WEB', 'MOBILE_APP', 'IN_STORE', 'MARKETPLACE') NOT NULL DEFAULT 'WEB',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0.00),
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    shipping_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_amount >= 0.00),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    utm_campaign VARCHAR(100) NULL,
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    INDEX idx_orders_customer_date (customer_id, order_date),
    INDEX idx_orders_date (order_date),
    INDEX idx_orders_status (status),
    INDEX idx_orders_channel (channel),
    INDEX idx_orders_total (total_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0.00),
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0.00),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_items_order (order_id),
    INDEX idx_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    payment_method ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'APPLE_PAY', 'BANK_TRANSFER', 'STORE_CREDIT') NOT NULL,
    status ENUM('AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'CAPTURED',
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0.00),
    transaction_reference VARCHAR(120) NULL,
    payment_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. DIGITAL BEHAVIOUR DOMAIN
CREATE TABLE IF NOT EXISTS website_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(64) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NULL,
    device_type ENUM('DESKTOP', 'MOBILE', 'TABLET') NOT NULL DEFAULT 'DESKTOP',
    browser VARCHAR(50) NULL,
    operating_system VARCHAR(50) NULL,
    traffic_source VARCHAR(50) NOT NULL,
    landing_page VARCHAR(255) NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME NULL,
    page_views_count INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_sessions_customer (customer_id),
    INDEX idx_sessions_started (started_at),
    INDEX idx_sessions_source (traffic_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NULL,
    event_type ENUM('PAGE_VIEW', 'PRODUCT_VIEW', 'SEARCH', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'CHECKOUT_START', 'PURCHASE') NOT NULL,
    product_id BIGINT UNSIGNED NULL,
    page_url VARCHAR(255) NOT NULL,
    event_metadata JSON NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (session_id) REFERENCES website_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_web_events_customer_time (customer_id, created_at),
    INDEX idx_web_events_type_time (event_type, created_at),
    INDEX idx_web_events_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mobile_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    app_version VARCHAR(20) NOT NULL,
    os_version VARCHAR(20) NOT NULL,
    device_model VARCHAR(50) NULL,
    event_name VARCHAR(100) NOT NULL,
    screen_name VARCHAR(100) NULL,
    event_metadata JSON NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_mobile_events_customer (customer_id, created_at),
    INDEX idx_mobile_events_name (event_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. MARKETING & CAMPAIGN DOMAIN
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    channel ENUM('GOOGLE_SEARCH', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'EMAIL', 'SMS', 'AFFILIATE', 'TIKTOK') NOT NULL,
    target_audience VARCHAR(100) NOT NULL DEFAULT 'All Customers',
    budget DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (budget >= 0.00),
    actual_spend DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (actual_spend >= 0.00),
    start_date DATETIME NOT NULL,
    end_date DATETIME NULL,
    status ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_campaigns_channel (channel),
    INDEX idx_campaigns_dates (start_date, end_date),
    INDEX idx_campaigns_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaign_impressions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NULL,
    impression_date DATETIME NOT NULL,
    placement VARCHAR(100) NULL,
    cost DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_imp_campaign_date (campaign_id, impression_date),
    INDEX idx_imp_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaign_interactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    interaction_type ENUM('AD_CLICK', 'LINK_CLICK', 'CTA_CLICK', 'FORM_SUBMIT') NOT NULL,
    interaction_date DATETIME NOT NULL,
    cost DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_interact_customer_date (customer_id, interaction_date),
    INDEX idx_interact_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT UNSIGNED NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    event_type ENUM('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED') NOT NULL,
    subject VARCHAR(255) NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_email_cust_event (customer_id, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sms_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT UNSIGNED NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    event_type ENUM('SENT', 'DELIVERED', 'CLICKED', 'FAILED', 'OPT_OUT') NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_sms_cust_event (customer_id, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SUPPORT & FEEDBACK DOMAIN
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(64) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    category ENUM('BILLING', 'SHIPPING', 'PRODUCT_DEFECT', 'RETURN_EXCHANGE', 'GENERAL_INQUIRY') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    subject VARCHAR(255) NOT NULL,
    opened_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,
    satisfaction_score TINYINT UNSIGNED NULL CHECK (satisfaction_score BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_tickets_customer (customer_id),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_opened (opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    nps_score TINYINT UNSIGNED NULL CHECK (nps_score BETWEEN 0 AND 10),
    comments TEXT NULL,
    submitted_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_feedback_customer (customer_id),
    INDEX idx_feedback_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ANALYTICS, SEGMENTATION & MACHINE LEARNING DOMAIN
CREATE TABLE IF NOT EXISTS rfm_scores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    recency_days INT UNSIGNED NOT NULL,
    frequency_count INT UNSIGNED NOT NULL,
    monetary_total DECIMAL(12,2) NOT NULL,
    r_score TINYINT UNSIGNED NOT NULL CHECK (r_score BETWEEN 1 AND 5),
    f_score TINYINT UNSIGNED NOT NULL CHECK (f_score BETWEEN 1 AND 5),
    m_score TINYINT UNSIGNED NOT NULL CHECK (m_score BETWEEN 1 AND 5),
    rfm_cell VARCHAR(3) NOT NULL,
    segment_name VARCHAR(50) NOT NULL,
    calculated_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY uq_rfm_customer (customer_id),
    INDEX idx_rfm_segment (segment_name),
    INDEX idx_rfm_r_score (r_score),
    INDEX idx_rfm_f_score (f_score),
    INDEX idx_rfm_m_score (m_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS model_runs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    model_type ENUM('KMEANS_CLUSTERING', 'CHURN_CLASSIFICATION', 'CLV_REGRESSION') NOT NULL,
    model_version VARCHAR(50) NOT NULL UNIQUE,
    training_timestamp DATETIME NOT NULL,
    training_row_count INT UNSIGNED NOT NULL,
    feature_names JSON NOT NULL,
    hyperparameters JSON NOT NULL,
    metrics JSON NOT NULL,
    artifact_path VARCHAR(255) NOT NULL,
    status ENUM('TRAINING', 'ACTIVE', 'DEPRECATED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_runs_type (model_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_segments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    model_run_id BIGINT UNSIGNED NOT NULL,
    cluster_id INT NOT NULL,
    cluster_label VARCHAR(100) NOT NULL,
    distance_to_centroid DOUBLE NULL,
    assigned_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_cust_model (customer_id, model_run_id),
    INDEX idx_segments_cluster (cluster_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS churn_predictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    model_run_id BIGINT UNSIGNED NOT NULL,
    churn_probability DECIMAL(5,4) NOT NULL CHECK (churn_probability BETWEEN 0.0000 AND 1.0000),
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    prediction_timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_churn_cust_run (customer_id, model_run_id),
    INDEX idx_churn_risk (risk_level),
    INDEX idx_churn_prob (churn_probability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clv_predictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    model_run_id BIGINT UNSIGNED NOT NULL,
    predicted_clv DECIMAL(12,2) NOT NULL CHECK (predicted_clv >= 0.00),
    prediction_horizon_days INT UNSIGNED NOT NULL DEFAULT 180,
    prediction_timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_clv_cust_run (customer_id, model_run_id),
    INDEX idx_clv_value (predicted_clv)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attribution_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    campaign_id BIGINT UNSIGNED NOT NULL,
    attribution_model ENUM('FIRST_TOUCH', 'LAST_TOUCH', 'MULTI_TOUCH') NOT NULL,
    touchpoint_timestamp DATETIME NOT NULL,
    weight DECIMAL(6,4) NOT NULL CHECK (weight BETWEEN 0.0000 AND 1.0000),
    attributed_revenue DECIMAL(12,2) NOT NULL CHECK (attributed_revenue >= 0.00),
    calculated_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_attr_model_camp (attribution_model, campaign_id),
    INDEX idx_attr_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    recommendation_type VARCHAR(100) NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    recommended_channel VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    supporting_metrics JSON NOT NULL,
    status ENUM('NEW', 'REVIEWED', 'ACCEPTED', 'DISMISSED', 'COMPLETED') NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_rec_cust (customer_id),
    INDEX idx_rec_status (status),
    INDEX idx_rec_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
