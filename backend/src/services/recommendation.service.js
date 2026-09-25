/**
 * Explainable Recommendation Engine
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 *
 * Deterministic business rules translating Customer 360, RFM, ML predictions,
 * and support status into actionable decision-support recommendations.
 */

const { pool } = require('../config/database');

class RecommendationService {
  /**
   * Evaluates rules for all customers and persists active recommendations
   */
  async generateRecommendations() {
    console.log('Generating explainable marketing recommendations from Customer 360 data...');

    // Fetch customer 360 signals: RFM, Churn risk, CLV, open tickets, orders, preferences
    const [candidates] = await pool.query(`
      SELECT c.id as customer_id, c.first_name, c.last_name, c.preferred_channel,
             COALESCE(r.segment_name, 'Unknown') as segment_name,
             COALESCE(r.recency_days, 999) as recency_days,
             COALESCE(r.frequency_count, 0) as frequency_count,
             COALESCE(r.monetary_total, 0.00) as monetary_total,
             cp.churn_probability, cp.risk_level as churn_risk,
             clv.predicted_clv,
             COALESCE(st.open_tickets, 0) as open_tickets,
             st.urgent_tickets,
             pref.interest_categories,
             mkt.impressions_count, mkt.clicks_count
      FROM customers c
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
      LEFT JOIN (
        SELECT customer_id, 
               COUNT(id) as open_tickets,
               SUM(CASE WHEN priority = 'URGENT' THEN 1 ELSE 0 END) as urgent_tickets
        FROM support_tickets
        WHERE status IN ('OPEN', 'IN_PROGRESS')
        GROUP BY customer_id
      ) st ON c.id = st.customer_id
      LEFT JOIN customer_preferences pref ON c.id = pref.customer_id
      LEFT JOIN (
        SELECT customer_id, COUNT(id) as impressions_count, 0 as clicks_count
        FROM campaign_impressions
        GROUP BY customer_id
      ) mkt ON c.id = mkt.customer_id
      WHERE c.status = 'ACTIVE';
    `);

    const recommendations = [];

    for (const c of candidates) {
      const churnProb = parseFloat(c.churn_probability || 0);
      const predictedClv = parseFloat(c.predicted_clv || 0);
      const recency = parseInt(c.recency_days, 10);
      const openTickets = parseInt(c.open_tickets, 10);
      const urgentTickets = parseInt(c.urgent_tickets || 0, 10);
      const impressions = parseInt(c.impressions_count || 0, 10);

      // RULE 1: Unresolved Urgent Support Issue -> SUPPRESS MARKETING & RESOLVE
      if (openTickets > 0) {
        recommendations.push([
          c.customer_id,
          'RESOLVE_SUPPORT_FIRST',
          urgentTickets > 0 ? 'CRITICAL' : 'HIGH',
          'Customer Support Desk',
          `Customer has ${openTickets} open support ticket(s). Promotional outreach should be paused until the service issue is resolved to prevent negative brand sentiment.`,
          JSON.stringify({ openTickets, urgentTickets, satisfactionRisk: true }),
          'NEW'
        ]);
        continue; // Suppress promotional rules until support is addressed
      }

      // RULE 2: High Churn Risk -> WIN-BACK CAMPAIGN
      if (churnProb >= 0.70 || c.churn_risk === 'HIGH' || c.segment_name === 'At Risk') {
        recommendations.push([
          c.customer_id,
          'WIN_BACK_DISCOUNT',
          'HIGH',
          c.preferred_channel === 'Mobile App' ? 'Push Notification' : 'Email',
          `Churn probability evaluated at ${(churnProb * 100).toFixed(1)}% with ${recency} days of inactivity. Trigger an exclusive 15-20% win-back incentive tailored to past purchases.`,
          JSON.stringify({ churnProbability: churnProb, recencyDays: recency, rfmSegment: c.segment_name }),
          'NEW'
        ]);
      }

      // RULE 3: Champions / VIP High CLV -> LOYALTY REWARDS & EARLY ACCESS
      else if (c.segment_name === 'Champions' || predictedClv > 1000) {
        recommendations.push([
          c.customer_id,
          'VIP_LOYALTY',
          'HIGH',
          'Email',
          `Top-tier customer with projected 180-day CLV of $${predictedClv.toFixed(2)} and Champion RFM status. Enroll in VIP concierge perks and grant 24-hour early access to upcoming product drops.`,
          JSON.stringify({ predictedClv, rfmSegment: c.segment_name, totalSpend: parseFloat(c.monetary_total) }),
          'NEW'
        ]);
      }

      // RULE 4: Recent Purchase (< 14 days) -> POST-PURCHASE FEEDBACK & REVIEW
      else if (recency <= 14 && recency > 0) {
        recommendations.push([
          c.customer_id,
          'FEEDBACK_REQUEST',
          'LOW',
          'Email',
          `Customer completed a purchase ${recency} day(s) ago. Send a warm post-delivery satisfaction survey and invite them to leave a verified product review.`,
          JSON.stringify({ recencyDays: recency, frequency: c.frequency_count }),
          'NEW'
        ]);
      }

      // RULE 5: High Marketing Exposure + Low Engagement -> REDUCE FREQUENCY (FATIGUE)
      else if (impressions > 15 && c.segment_name === 'Need Attention') {
        recommendations.push([
          c.customer_id,
          'REDUCE_FREQUENCY',
          'MEDIUM',
          'All Digital Channels',
          `Customer served ${impressions} campaign impressions with low interaction velocity. Throttle ad frequency capping to avoid brand fatigue and improve ad spend efficiency.`,
          JSON.stringify({ impressionsCount: impressions, rfmSegment: c.segment_name }),
          'NEW'
        ]);
      }

      // RULE 6: Category Cross-sell for Potential Loyalists
      else if (c.segment_name === 'Potential Loyalists') {
        let cat = 'Electronics';
        try {
          const parsed = JSON.parse(c.interest_categories);
          if (Array.isArray(parsed) && parsed.length > 0) cat = parsed[0];
        } catch (e) {}

        recommendations.push([
          c.customer_id,
          'CROSS_SELL',
          'MEDIUM',
          c.preferred_channel === 'Mobile App' ? 'Mobile In-App' : 'Email',
          `High growth potential customer in the ${c.segment_name} segment. Cross-sell complementary trending items in ${cat}.`,
          JSON.stringify({ preferredCategory: cat, rfmSegment: c.segment_name }),
          'NEW'
        ]);
      }
    }

    // Persist to recommendations table
    // Clean old recommendations to refresh decision support state
    await pool.query('TRUNCATE TABLE recommendations;');

    const batchSize = 2500;
    for (let i = 0; i < recommendations.length; i += batchSize) {
      const chunk = recommendations.slice(i, i + batchSize);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(', ');
      const flat = chunk.flat();

      const sql = `
        INSERT INTO recommendations
          (customer_id, recommendation_type, priority, recommended_channel, reason, supporting_metrics, status, created_at, updated_at)
        VALUES ${placeholders};
      `;
      await pool.query(sql, flat);
    }

    console.log(`Successfully generated and stored ${recommendations.length} explainable recommendations.`);
    return {
      generatedCount: recommendations.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * List recommendations with filtering and pagination
   */
  async getRecommendations({ page = 1, limit = 25, status = '', priority = '', type = '', channel = '', search = '' }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('r.priority = ?');
      params.push(priority);
    }
    if (type) {
      conditions.push('r.recommendation_type = ?');
      params.push(type);
    }
    if (channel) {
      conditions.push('r.recommended_channel = ?');
      params.push(channel);
    }
    if (search) {
      conditions.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR r.reason LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [cntRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM recommendations r
      JOIN customers c ON r.customer_id = c.id
      ${where};
    `, params);
    const total = cntRows[0].total;

    const sql = `
      SELECT r.*, c.first_name, c.last_name, c.email as customer_email,
             c.acquisition_channel, c.preferred_channel as customer_pref_channel
      FROM recommendations r
      JOIN customers c ON r.customer_id = c.id
      ${where}
      ORDER BY FIELD(r.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC
      LIMIT ? OFFSET ?;
    `;

    const [rows] = await pool.query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    return {
      recommendations: rows.map(r => ({
        id: r.id,
        customerId: r.customer_id,
        customerName: `${r.first_name} ${r.last_name}`,
        customerEmail: r.customer_email,
        type: r.recommendation_type,
        priority: r.priority,
        recommendedChannel: r.recommended_channel,
        reason: r.reason,
        supportingMetrics: r.supporting_metrics,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      })),
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  /**
   * Update recommendation status workflow (NEW -> REVIEWED -> ACCEPTED / DISMISSED -> COMPLETED)
   */
  async updateStatus(id, { status, notes = '' }) {
    const validStatuses = ['NEW', 'REVIEWED', 'ACCEPTED', 'DISMISSED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const [check] = await pool.query('SELECT * FROM recommendations WHERE id = ?;', [id]);
    if (check.length === 0) {
      const err = new Error(`Recommendation with ID ${id} not found.`);
      err.statusCode = 404;
      err.code = 'RECOMMENDATION_NOT_FOUND';
      throw err;
    }

    await pool.query('UPDATE recommendations SET status = ?, updated_at = NOW() WHERE id = ?;', [status, id]);

    const [updated] = await pool.query(`
      SELECT r.*, c.first_name, c.last_name, c.email as customer_email
      FROM recommendations r
      JOIN customers c ON r.customer_id = c.id
      WHERE r.id = ?;
    `, [id]);

    const r = updated[0];
    return {
      id: r.id,
      customerId: r.customer_id,
      customerName: `${r.first_name} ${r.last_name}`,
      customerEmail: r.customer_email,
      type: r.recommendation_type,
      priority: r.priority,
      recommendedChannel: r.recommended_channel,
      reason: r.reason,
      supportingMetrics: r.supporting_metrics,
      status: r.status,
      updatedAt: r.updated_at,
      actionNotes: notes
    };
  }
}

module.exports = new RecommendationService();
