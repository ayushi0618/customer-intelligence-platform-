/**
 * Analytics Repository
 * Database-backed Descriptive Analytics & Funnel Calculations from MySQL 8
 */

const { pool } = require('../config/database');

class AnalyticsRepository {
  /**
   * Executive Overview KPIs
   */
  async getOverview({ startDate = '', endDate = '', channel = '' }) {
    const conditions = [];
    const params = [];

    if (startDate) {
      conditions.push('order_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('order_date <= ?');
      params.push(endDate);
    }
    if (channel) {
      conditions.push('channel = ?');
      params.push(channel);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Core transactional totals
    const [orderTotals] = await pool.query(`
      SELECT COUNT(id) as total_orders,
             COALESCE(SUM(total_amount), 0.00) as total_revenue,
             COALESCE(AVG(total_amount), 0.00) as aov,
             COUNT(DISTINCT customer_id) as ordering_customers
      FROM orders
      ${where};
    `, params);

    const { total_orders, total_revenue, aov, ordering_customers } = orderTotals[0];

    // 2. Total active customers
    const [custTotals] = await pool.query('SELECT COUNT(id) as total_customers FROM customers WHERE status = "ACTIVE";');
    const total_customers = custTotals[0].total_customers;

    // 3. Repeat purchase rate
    const [repeatRows] = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN order_cnt > 1 THEN customer_id END) as repeat_customers,
        COUNT(DISTINCT customer_id) as total_ordering_customers
      FROM (
        SELECT customer_id, COUNT(id) as order_cnt
        FROM orders
        ${where}
        GROUP BY customer_id
      ) t;
    `, params);

    const repeatCustomers = repeatRows[0].repeat_customers || 0;
    const totalOrderingCustomers = repeatRows[0].total_ordering_customers || 1;
    const repeatPurchaseRate = parseFloat(((repeatCustomers / totalOrderingCustomers) * 100).toFixed(2));

    // 4. Marketing spend & Blended ROI
    const [campTotals] = await pool.query('SELECT COALESCE(SUM(actual_spend), 0.00) as total_spend FROM campaigns;');
    const totalSpend = parseFloat(campTotals[0].total_spend);
    const revNum = parseFloat(total_revenue);
    const blendedRoi = totalSpend > 0 ? parseFloat((((revNum - totalSpend) / totalSpend) * 100).toFixed(2)) : 0.00;

    // 5. Funnel conversion rate
    const [funnelTotals] = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT session_id) FROM website_events) as total_sessions,
        (SELECT COUNT(DISTINCT session_id) FROM website_events WHERE event_type = 'PURCHASE') as purchase_sessions;
    `);
    const totalSessions = funnelTotals[0].total_sessions || 1;
    const purchaseSessions = funnelTotals[0].purchase_sessions || 0;
    const conversionRate = parseFloat(((purchaseSessions / totalSessions) * 100).toFixed(2));

    return {
      totalRevenue: revNum,
      totalOrders: parseInt(total_orders, 10),
      totalCustomers: parseInt(total_customers, 10),
      averageOrderValue: parseFloat(parseFloat(aov).toFixed(2)),
      repeatPurchaseRate,
      conversionRate,
      marketingSpend: totalSpend,
      blendedRoi,
      orderingCustomers: parseInt(ordering_customers, 10)
    };
  }

  /**
   * Time-series revenue and orders
   */
  async getRevenueTrend({ interval = 'month', startDate = '', endDate = '' }) {
    let groupFormat = '%Y-%m';
    if (interval === 'day') groupFormat = '%Y-%m-%d';
    if (interval === 'week') groupFormat = '%Y-%u';

    const conditions = [];
    const params = [];

    if (startDate) {
      conditions.push('order_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('order_date <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT DATE_FORMAT(order_date, '${groupFormat}') as period,
             SUM(total_amount) as revenue,
             COUNT(id) as orders,
             AVG(total_amount) as aov,
             COUNT(DISTINCT customer_id) as active_customers
      FROM orders
      ${where}
      GROUP BY period
      ORDER BY period ASC;
    `;

    const [rows] = await pool.query(sql, params);
    return rows.map(r => ({
      period: r.period,
      revenue: parseFloat(r.revenue),
      orders: parseInt(r.orders, 10),
      aov: parseFloat(parseFloat(r.aov).toFixed(2)),
      activeCustomers: parseInt(r.active_customers, 10)
    }));
  }

  /**
   * Channel breakdown
   */
  async getChannelAnalytics() {
    const [rows] = await pool.query(`
      SELECT channel,
             COUNT(id) as orders_count,
             SUM(total_amount) as revenue,
             AVG(total_amount) as aov,
             COUNT(DISTINCT customer_id) as customers_count
      FROM orders
      GROUP BY channel
      ORDER BY revenue DESC;
    `);

    return rows.map(r => ({
      channel: r.channel,
      ordersCount: parseInt(r.orders_count, 10),
      revenue: parseFloat(r.revenue),
      aov: parseFloat(parseFloat(r.aov).toFixed(2)),
      customersCount: parseInt(r.customers_count, 10)
    }));
  }

  /**
   * Product performance
   */
  async getProductPerformance({ limit = 10, categoryId = null }) {
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.id, p.name, p.sku, cat.name as category_name, p.price, p.cost,
             SUM(oi.quantity) as units_sold,
             SUM(oi.total_price) as total_revenue,
             SUM((p.price - p.cost) * oi.quantity) as total_margin
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN product_categories cat ON p.category_id = cat.id
      ${where}
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT ?;
    `;

    const [rows] = await pool.query(sql, [...params, parseInt(limit, 10)]);

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      categoryName: r.category_name,
      price: parseFloat(r.price),
      cost: parseFloat(r.cost),
      unitsSold: parseInt(r.units_sold, 10),
      totalRevenue: parseFloat(r.total_revenue),
      totalMargin: parseFloat(r.total_margin)
    }));
  }

  /**
   * 5-Stage Conversion Funnel Calculation
   */
  async getFunnel({ startDate = '', endDate = '', deviceType = '', trafficSource = '' }) {
    const sessionConditions = [];
    const sessionParams = [];

    if (startDate) {
      sessionConditions.push('ws.started_at >= ?');
      sessionParams.push(startDate);
    }
    if (endDate) {
      sessionConditions.push('ws.started_at <= ?');
      sessionParams.push(endDate);
    }
    if (deviceType) {
      sessionConditions.push('ws.device_type = ?');
      sessionParams.push(deviceType);
    }
    if (trafficSource) {
      sessionConditions.push('ws.traffic_source = ?');
      sessionParams.push(trafficSource);
    }

    const where = sessionConditions.length > 0 ? `WHERE ${sessionConditions.join(' AND ')}` : '';

    // Stage counts by distinct sessions
    const sql = `
      SELECT 
        COUNT(DISTINCT ws.id) as stage_1_visitors,
        COUNT(DISTINCT CASE WHEN we.event_type = 'PRODUCT_VIEW' THEN ws.id END) as stage_2_views,
        COUNT(DISTINCT CASE WHEN we.event_type = 'ADD_TO_CART' THEN ws.id END) as stage_3_cart,
        COUNT(DISTINCT CASE WHEN we.event_type = 'CHECKOUT_START' THEN ws.id END) as stage_4_checkout,
        COUNT(DISTINCT CASE WHEN we.event_type = 'PURCHASE' THEN ws.id END) as stage_5_purchase
      FROM website_sessions ws
      LEFT JOIN website_events we ON ws.id = we.session_id
      ${where};
    `;

    const [rows] = await pool.query(sql, sessionParams);
    const data = rows[0];

    const s1 = parseInt(data.stage_1_visitors, 10) || 0;
    const s2 = parseInt(data.stage_2_views, 10) || 0;
    const s3 = parseInt(data.stage_3_cart, 10) || 0;
    const s4 = parseInt(data.stage_4_checkout, 10) || 0;
    const s5 = parseInt(data.stage_5_purchase, 10) || 0;

    const stages = [
      {
        stage: 'Visitors',
        count: s1,
        conversionRate: 100.0,
        dropOffCount: 0,
        dropOffRate: 0.0
      },
      {
        stage: 'Product Views',
        count: s2,
        conversionRate: s1 > 0 ? parseFloat(((s2 / s1) * 100).toFixed(2)) : 0.0,
        dropOffCount: Math.max(0, s1 - s2),
        dropOffRate: s1 > 0 ? parseFloat((((s1 - s2) / s1) * 100).toFixed(2)) : 0.0
      },
      {
        stage: 'Add to Cart',
        count: s3,
        conversionRate: s2 > 0 ? parseFloat(((s3 / s2) * 100).toFixed(2)) : 0.0,
        dropOffCount: Math.max(0, s2 - s3),
        dropOffRate: s2 > 0 ? parseFloat((((s2 - s3) / s2) * 100).toFixed(2)) : 0.0
      },
      {
        stage: 'Checkout Started',
        count: s4,
        conversionRate: s3 > 0 ? parseFloat(((s4 / s3) * 100).toFixed(2)) : 0.0,
        dropOffCount: Math.max(0, s3 - s4),
        dropOffRate: s3 > 0 ? parseFloat((((s3 - s4) / s3) * 100).toFixed(2)) : 0.0
      },
      {
        stage: 'Purchase Completed',
        count: s5,
        conversionRate: s4 > 0 ? parseFloat(((s5 / s4) * 100).toFixed(2)) : 0.0,
        dropOffCount: Math.max(0, s4 - s5),
        dropOffRate: s4 > 0 ? parseFloat((((s4 - s5) / s4) * 100).toFixed(2)) : 0.0
      }
    ];

    const overallConversion = s1 > 0 ? parseFloat(((s5 / s1) * 100).toFixed(2)) : 0.0;

    return {
      stages,
      overallConversionRate: overallConversion,
      totalSessions: s1,
      totalPurchases: s5
    };
  }
}

module.exports = new AnalyticsRepository();
