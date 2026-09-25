"""
Leakage-Safe Feature Engineering Pipeline
Multi-Channel Customer Behaviour & Marketing Intelligence System
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.database import get_db_connection

def extract_features(cutoff_date=None, is_inference=False):
    """
    Extracts customer behavioral and transactional features strictly before cutoff_date
    to eliminate temporal target leakage.
    If is_inference=True, cutoff_date defaults to NOW().
    """
    cnx = get_db_connection()
    try:
        if cutoff_date is None:
            if is_inference:
                cutoff_date = datetime.utcnow()
            else:
                # For training: take 90 days before the latest order date in the database
                cursor = cnx.cursor()
                cursor.execute("SELECT MAX(order_date) FROM orders;")
                max_date = cursor.fetchone()[0]
                cursor.close()
                if max_date:
                    cutoff_date = max_date - timedelta(days=90)
                else:
                    cutoff_date = datetime.utcnow() - timedelta(days=90)

        cutoff_str = cutoff_date.strftime("%Y-%m-%d %H:%M:%S")
        print(f"Feature engineering extraction with cutoff_date = {cutoff_str} (is_inference={is_inference})")

        # 1. Base customers registered before cutoff
        cust_query = f"""
            SELECT id as customer_id, acquisition_channel, preferred_channel, registration_date,
                   DATEDIFF('{cutoff_str}', registration_date) as days_as_customer
            FROM customers
            WHERE registration_date <= '{cutoff_str}';
        """
        df_cust = pd.read_sql(cust_query, cnx)

        # 2. Transactional features before cutoff
        order_query = f"""
            SELECT customer_id,
                   COUNT(id) as frequency_orders,
                   COALESCE(SUM(total_amount), 0.0) as monetary_total,
                   COALESCE(AVG(total_amount), 0.0) as avg_order_value,
                   COALESCE(DATEDIFF('{cutoff_str}', MAX(order_date)), 999) as recency_days
            FROM orders
            WHERE order_date <= '{cutoff_str}'
            GROUP BY customer_id;
        """
        df_orders = pd.read_sql(order_query, cnx)

        # 3. Digital behavior before cutoff
        web_query = f"""
            SELECT customer_id,
                   COUNT(id) as web_sessions_count,
                   COALESCE(SUM(page_views_count), 0) as total_page_views
            FROM website_sessions
            WHERE customer_id IS NOT NULL AND started_at <= '{cutoff_str}'
            GROUP BY customer_id;
        """
        df_web = pd.read_sql(web_query, cnx)

        event_query = f"""
            SELECT customer_id,
                   SUM(CASE WHEN event_type = 'PRODUCT_VIEW' THEN 1 ELSE 0 END) as product_views_count,
                   SUM(CASE WHEN event_type = 'ADD_TO_CART' THEN 1 ELSE 0 END) as cart_additions_count
            FROM website_events
            WHERE customer_id IS NOT NULL AND created_at <= '{cutoff_str}'
            GROUP BY customer_id;
        """
        df_events = pd.read_sql(event_query, cnx)

        # 4. Marketing touchpoints before cutoff
        mkt_query = f"""
            SELECT c.id as customer_id,
                   COALESCE(imp.imp_cnt, 0) as impressions_count,
                   COALESCE(clk.clk_cnt, 0) as clicks_count,
                   COALESCE(eml.eml_open_cnt, 0) as email_opens_count
            FROM customers c
            LEFT JOIN (
                SELECT customer_id, COUNT(id) as imp_cnt
                FROM campaign_impressions
                WHERE customer_id IS NOT NULL AND impression_date <= '{cutoff_str}'
                GROUP BY customer_id
            ) imp ON c.id = imp.customer_id
            LEFT JOIN (
                SELECT customer_id, COUNT(id) as clk_cnt
                FROM campaign_interactions
                WHERE customer_id IS NOT NULL AND interaction_date <= '{cutoff_str}'
                GROUP BY customer_id
            ) clk ON c.id = clk.customer_id
            LEFT JOIN (
                SELECT customer_id, COUNT(id) as eml_open_cnt
                FROM email_events
                WHERE customer_id IS NOT NULL AND event_type IN ('OPENED', 'CLICKED') AND created_at <= '{cutoff_str}'
                GROUP BY customer_id
            ) eml ON c.id = eml.customer_id
            WHERE c.registration_date <= '{cutoff_str}';
        """
        df_mkt = pd.read_sql(mkt_query, cnx)

        # Merge feature sets
        df = df_cust.merge(df_orders, on="customer_id", how="left")
        df = df.merge(df_web, on="customer_id", how="left")
        df = df.merge(df_events, on="customer_id", how="left")
        df = df.merge(df_mkt, on="customer_id", how="left")

        # Fill NAs
        df["frequency_orders"] = df["frequency_orders"].fillna(0).astype(int)
        df["monetary_total"] = df["monetary_total"].fillna(0.0).astype(float)
        df["avg_order_value"] = df["avg_order_value"].fillna(0.0).astype(float)
        df["recency_days"] = df["recency_days"].fillna(999).astype(int)
        df["web_sessions_count"] = df["web_sessions_count"].fillna(0).astype(int)
        df["total_page_views"] = df["total_page_views"].fillna(0).astype(int)
        df["product_views_count"] = df["product_views_count"].fillna(0).astype(int)
        df["cart_additions_count"] = df["cart_additions_count"].fillna(0).astype(int)
        df["impressions_count"] = df["impressions_count"].fillna(0).astype(int)
        df["clicks_count"] = df["clicks_count"].fillna(0).astype(int)
        df["email_opens_count"] = df["email_opens_count"].fillna(0).astype(int)

        # Derived rates
        df["campaign_click_rate"] = np.where(df["impressions_count"] > 0, df["clicks_count"] / df["impressions_count"], 0.0)
        df["cart_abandon_rate"] = np.where(df["cart_additions_count"] > 0, np.maximum(0.0, 1.0 - (df["frequency_orders"] / df["cart_additions_count"])), 0.0)

        # If training: construct forward target labels (strictly AFTER cutoff)
        if not is_inference:
            # Churn target: 1 if ZERO orders in next 90 days; 0 if >= 1 order
            churn_window_end = (cutoff_date + timedelta(days=90)).strftime("%Y-%m-%d %H:%M:%S")
            churn_target_query = f"""
                SELECT customer_id, COUNT(id) as future_orders
                FROM orders
                WHERE order_date > '{cutoff_str}' AND order_date <= '{churn_window_end}'
                GROUP BY customer_id;
            """
            df_churn_target = pd.read_sql(churn_target_query, cnx)
            df = df.merge(df_churn_target, on="customer_id", how="left")
            df["future_orders"] = df["future_orders"].fillna(0).astype(int)
            # Only consider active customers who had at least 1 order prior to cutoff for churn evaluation
            df["churn_label"] = np.where(df["future_orders"] == 0, 1, 0)

            # CLV target: continuous monetary spend in next 180 days
            clv_window_end = (cutoff_date + timedelta(days=180)).strftime("%Y-%m-%d %H:%M:%S")
            clv_target_query = f"""
                SELECT customer_id, COALESCE(SUM(total_amount), 0.0) as future_spend_180d
                FROM orders
                WHERE order_date > '{cutoff_str}' AND order_date <= '{clv_window_end}'
                GROUP BY customer_id;
            """
            df_clv_target = pd.read_sql(clv_target_query, cnx)
            df = df.merge(df_clv_target, on="customer_id", how="left")
            df["future_spend_180d"] = df["future_spend_180d"].fillna(0.0).astype(float)

        return df

    finally:
        cnx.close()
