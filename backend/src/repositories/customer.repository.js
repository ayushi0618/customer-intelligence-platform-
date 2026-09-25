/**
 * Customer Repository
 * Optimized parameterized SQL queries for Customer 360, filtering, and journey timeline
 */

const { pool } = require('../config/database');

class CustomerRepository {
  /**
   * Search and filter customers with pagination
   */
  async findAll({ page = 1, limit = 25, search = '', segment = '', churnRisk = '', channel = '', minSpend = 0, sortBy = 'registration_date', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.city LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (segment) {
      conditions.push('r.segment_name = ?');
      params.push(segment);
    }

    if (churnRisk) {
      conditions.push('cp.risk_level = ?');
      params.push(churnRisk);
    }

    if (channel) {
      conditions.push('(c.acquisition_channel = ? OR c.preferred_channel = ?)');
      params.push(channel, channel);
    }

    if (minSpend > 0) {
      conditions.push('COALESCE(o.total_spend, 0) >= ?');
      params.push(minSpend);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = ['id', 'first_name', 'last_name', 'email', 'registration_date', 'total_spend', 'order_count', 'recency_days', 'churn_probability'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'registration_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN rfm_scores r ON c.id = r.customer_id
      LEFT JOIN (
        SELECT customer_id, risk_level, churn_probability
        FROM churn_predictions cp1
        WHERE id = (SELECT MAX(id) FROM churn_predictions cp2 WHERE cp2.customer_id = cp1.customer_id)
      ) cp ON c.id = cp.customer_id
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) as total_spend, COUNT(id) as order_count
        FROM orders
        GROUP BY customer_id
      ) o ON c.id = o.customer_id
      ${whereClause};
    `;

    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Data query
    const dataSql = `
      SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.gender, c.city, c.state, c.country,
             c.acquisition_channel, c.preferred_channel, c.status, c.registration_date,
             COALESCE(o.order_count, 0) as order_count,
             COALESCE(o.total_spend, 0.00) as total_spend,
             COALESCE(o.avg_order_value, 0.00) as avg_order_value,
             o.last_order_date,
             DATEDIFF(NOW(), o.last_order_date) as days_since_last_order,
             r.rfm_cell, r.segment_name as rfm_segment,
             cp.churn_probability, cp.risk_level as churn_risk,
             clv.predicted_clv as predicted_clv_180d
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, 
               COUNT(id) as order_count, 
               SUM(total_amount) as total_spend,
               AVG(total_amount) as avg_order_value,
               MAX(order_date) as last_order_date
        FROM orders
        GROUP BY customer_id
      ) o ON c.id = o.customer_id
      LEFT JOIN rfm_scores r ON c.id = r.customer_id
      LEFT JOIN (
        SELECT customer_id, risk_level, churn_probability
        FROM churn_predictions cp1
        WHERE id = (SELECT MAX(id) FROM churn_predictions cp2 WHERE cp2.customer_id = cp1.customer_id)
      ) cp ON c.id = cp.customer_id
      LEFT JOIN (
        SELECT customer_id, predicted_clv
        FROM clv_predictions clv1
        WHERE id = (SELECT MAX(id) FROM clv_predictions clv2 WHERE clv2.customer_id = clv1.customer_id)
      ) clv ON c.id = clv.customer_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?;
    `;

    const [rows] = await pool.query(dataSql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    return {
      customers: rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  /**
   * Fetch single customer core profile
   */
  async findById(id) {
    const sql = `
      SELECT c.*, 
             cp.email_opt_in, cp.sms_opt_in, cp.push_opt_in, cp.preferred_language, cp.interest_categories,
             ca.street, ca.city as addr_city, ca.state as addr_state, ca.postal_code as addr_zip
      FROM customers c
      LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
      LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = 1
      WHERE c.id = ?;
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Complete Unified Customer 360 profile
   */
  async getCustomer360(id) {
    const profile = await this.findById(id);
    if (!profile) return null;

    // 1. Transactional metrics
    const [txRows] = await pool.query(`
      SELECT COUNT(id) as order_count,
             COALESCE(SUM(total_amount), 0.00) as total_spend,
             COALESCE(AVG(total_amount), 0.00) as avg_order_value,
             MAX(order_date) as last_order_date,
             MIN(order_date) as first_order_date,
             DATEDIFF(NOW(), MAX(order_date)) as days_since_last_order
      FROM orders
      WHERE customer_id = ?;
    `, [id]);
    const transactions = txRows[0];

    // 2. Digital Engagement
    const [sessRows] = await pool.query(`
      SELECT COUNT(id) as session_count,
             COALESCE(SUM(page_views_count), 0) as total_page_views,
             MAX(started_at) as last_session_date
      FROM website_sessions
      WHERE customer_id = ?;
    `, [id]);
    const sessions = sessRows[0];

    const [mobRows] = await pool.query(`
      SELECT COUNT(id) as mobile_events_count,
             MAX(created_at) as last_mobile_event
      FROM mobile_events
      WHERE customer_id = ?;
    `, [id]);
    const mobile = mobRows[0];

    // 3. Marketing touchpoints
    const [mktRows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM campaign_impressions WHERE customer_id = ?) as impressions_count,
        (SELECT COUNT(*) FROM campaign_interactions WHERE customer_id = ?) as clicks_count,
        (SELECT COUNT(*) FROM email_events WHERE customer_id = ?) as emails_received,
        (SELECT COUNT(*) FROM email_events WHERE customer_id = ? AND event_type IN ('OPENED', 'CLICKED')) as emails_opened,
        (SELECT COUNT(*) FROM sms_events WHERE customer_id = ?) as sms_received;
    `, [id, id, id, id, id]);
    const marketing = mktRows[0];

    // 4. Support and Feedback
    const [suppRows] = await pool.query(`
      SELECT COUNT(id) as ticket_count,
             SUM(CASE WHEN status IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) as open_tickets,
             AVG(satisfaction_score) as avg_csat
      FROM support_tickets
      WHERE customer_id = ?;
    `, [id]);
    const support = suppRows[0];

    const [fbRows] = await pool.query(`
      SELECT rating, nps_score, comments, submitted_at
      FROM feedback
      WHERE customer_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1;
    `, [id]);
    const latestFeedback = fbRows[0] || null;

    // 5. RFM Scores
    const [rfmRows] = await pool.query(`
      SELECT recency_days, frequency_count, monetary_total, r_score, f_score, m_score, rfm_cell, segment_name, calculated_at
      FROM rfm_scores
      WHERE customer_id = ?;
    `, [id]);
    const rfm = rfmRows[0] || null;

    // 6. Predictive (ML)
    const [churnRows] = await pool.query(`
      SELECT cp.churn_probability, cp.risk_level, cp.prediction_timestamp, mr.model_version
      FROM churn_predictions cp
      JOIN model_runs mr ON cp.model_run_id = mr.id
      WHERE cp.customer_id = ?
      ORDER BY cp.id DESC LIMIT 1;
    `, [id]);
    const churn = churnRows[0] || null;

    const [clvRows] = await pool.query(`
      SELECT clv.predicted_clv, clv.prediction_horizon_days, clv.prediction_timestamp
      FROM clv_predictions clv
      WHERE clv.customer_id = ?
      ORDER BY clv.id DESC LIMIT 1;
    `, [id]);
    const clv = clvRows[0] || null;

    const [segRows] = await pool.query(`
      SELECT cluster_id, cluster_label
      FROM customer_segments
      WHERE customer_id = ?
      ORDER BY id DESC LIMIT 1;
    `, [id]);
    const cluster = segRows[0] || null;

    // 7. Active Recommendations
    const [recRows] = await pool.query(`
      SELECT id, recommendation_type, priority, recommended_channel, reason, supporting_metrics, status, created_at
      FROM recommendations
      WHERE customer_id = ? AND status != 'DISMISSED'
      ORDER BY created_at DESC;
    `, [id]);

    return {
      profile: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        postalCode: profile.postal_code,
        acquisitionChannel: profile.acquisition_channel,
        preferredChannel: profile.preferred_channel,
        status: profile.status,
        registrationDate: profile.registration_date,
        preferences: {
          emailOptIn: !!profile.email_opt_in,
          smsOptIn: !!profile.sms_opt_in,
          pushOptIn: !!profile.push_opt_in,
          preferredLanguage: profile.preferred_language,
          interestCategories: profile.interest_categories
        }
      },
      transactions: {
        orderCount: transactions.order_count || 0,
        totalSpend: parseFloat(transactions.total_spend || 0),
        averageOrderValue: parseFloat(transactions.avg_order_value || 0),
        firstOrderDate: transactions.first_order_date,
        lastOrderDate: transactions.last_order_date,
        daysSinceLastOrder: transactions.days_since_last_order !== null ? transactions.days_since_last_order : null
      },
      digitalEngagement: {
        webSessionCount: sessions.session_count || 0,
        totalPageViews: sessions.total_page_views || 0,
        lastWebActivity: sessions.last_session_date,
        mobileEventsCount: mobile.mobile_events_count || 0,
        lastMobileActivity: mobile.last_mobile_event
      },
      marketingEngagement: {
        impressionsReceived: marketing.impressions_count || 0,
        campaignClicks: marketing.clicks_count || 0,
        emailsReceived: marketing.emails_received || 0,
        emailsOpened: marketing.emails_opened || 0,
        smsReceived: marketing.sms_received || 0
      },
      supportAndFeedback: {
        ticketCount: support.ticket_count || 0,
        openTickets: support.open_tickets || 0,
        averageSatisfaction: support.avg_csat ? parseFloat(parseFloat(support.avg_csat).toFixed(1)) : null,
        latestFeedback: latestFeedback
      },
      rfm: rfm ? {
        recencyDays: rfm.recency_days,
        frequencyCount: rfm.frequency_count,
        monetaryTotal: parseFloat(rfm.monetary_total),
        rScore: rfm.r_score,
        fScore: rfm.f_score,
        mScore: rfm.m_score,
        rfmCell: rfm.rfm_cell,
        segmentName: rfm.segment_name,
        calculatedAt: rfm.calculated_at
      } : null,
      predictions: {
        churnProbability: churn ? parseFloat(churn.churn_probability) : null,
        churnRisk: churn ? churn.risk_level : null,
        predictedClv180d: clv ? parseFloat(clv.predicted_clv) : null,
        clusterId: cluster ? cluster.cluster_id : null,
        clusterLabel: cluster ? cluster.cluster_label : null
      },
      recommendations: recRows.map(r => ({
        id: r.id,
        type: r.recommendation_type,
        priority: r.priority,
        recommendedChannel: r.recommended_channel,
        reason: r.reason,
        supportingMetrics: r.supporting_metrics,
        status: r.status,
        createdAt: r.created_at
      }))
    };
  }

  /**
   * Chronological Customer Journey Timeline
   */
  async getCustomerJourney(id) {
    const journey = [];

    // 1. Campaign Impressions
    const [imp] = await pool.query(`
      SELECT ci.impression_date as event_time, 'CAMPAIGN_IMPRESSION' as event_type, 
             c.name as title, c.channel as channel, ci.placement as details
      FROM campaign_impressions ci
      JOIN campaigns c ON ci.campaign_id = c.id
      WHERE ci.customer_id = ?
      LIMIT 15;
    `, [id]);
    imp.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `Ad Impression: ${r.title}`, channel: r.channel, details: { placement: r.details } }));

    // 2. Campaign Clicks
    const [int] = await pool.query(`
      SELECT ci.interaction_date as event_time, 'CAMPAIGN_CLICK' as event_type,
             c.name as title, c.channel as channel, ci.interaction_type as details
      FROM campaign_interactions ci
      JOIN campaigns c ON ci.campaign_id = c.id
      WHERE ci.customer_id = ?
      LIMIT 15;
    `, [id]);
    int.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `Ad Interaction: ${r.title}`, channel: r.channel, details: { interactionType: r.details } }));

    // 3. Website Sessions
    const [sess] = await pool.query(`
      SELECT started_at as event_time, 'WEBSITE_SESSION' as event_type,
             landing_page as title, traffic_source as channel, page_views_count as views, device_type
      FROM website_sessions
      WHERE customer_id = ?
      LIMIT 20;
    `, [id]);
    sess.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `Website Visit via ${r.channel}`, channel: 'Web', details: { landingPage: r.title, views: r.views, device: r.device_type } }));

    // 4. Cart & Web Funnel Events
    const [wev] = await pool.query(`
      SELECT we.created_at as event_time, we.event_type, p.name as prod_name, we.page_url
      FROM website_events we
      LEFT JOIN products p ON we.product_id = p.id
      WHERE we.customer_id = ? AND we.event_type IN ('PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_START')
      LIMIT 25;
    `, [id]);
    wev.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `${r.event_type.replace(/_/g, ' ')}: ${r.prod_name || r.page_url}`, channel: 'Web', details: { url: r.page_url } }));

    // 5. Orders placed
    const [ord] = await pool.query(`
      SELECT order_date as event_time, 'ORDER_PURCHASE' as event_type,
             order_number as title, channel, total_amount, subtotal
      FROM orders
      WHERE customer_id = ?
      LIMIT 20;
    `, [id]);
    ord.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `Order Placed #${r.title}`, channel: r.channel, details: { totalAmount: parseFloat(r.total_amount), subtotal: parseFloat(r.subtotal) } }));

    // 6. Emails
    const [eml] = await pool.query(`
      SELECT created_at as event_time, 'EMAIL_INTERACTION' as event_type,
             subject as title, event_type as status
      FROM email_events
      WHERE customer_id = ?
      LIMIT 15;
    `, [id]);
    eml.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `Email ${r.status}: ${r.title}`, channel: 'Email', details: { status: r.status } }));

    // 7. Support Tickets
    const [supp] = await pool.query(`
      SELECT opened_at as event_time, 'SUPPORT_TICKET' as event_type,
             ticket_number as title, category, priority, status
      FROM support_tickets
      WHERE customer_id = ?
      LIMIT 10;
    `, [id]);
    supp.forEach(r => journey.push({ timestamp: r.event_time, type: r.event_type, title: `Support Ticket #${r.title} (${r.category})`, channel: 'Support', details: { priority: r.priority, status: r.status } }));

    // Sort chronologically ascending
    journey.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return journey;
  }
}

module.exports = new CustomerRepository();
