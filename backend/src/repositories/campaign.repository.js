/**
 * Campaign Repository
 * Calculates real-time campaign performance, CTR, CPA, and ROI from MySQL
 */

const { pool } = require('../config/database');

class CampaignRepository {
  async findAll({ page = 1, limit = 25, channel = '', status = '' }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (channel) {
      conditions.push('c.channel = ?');
      params.push(channel);
    }
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [cntRows] = await pool.query(`SELECT COUNT(*) as total FROM campaigns c ${where};`, params);
    const total = cntRows[0].total;

    const sql = `
      SELECT c.*,
             COALESCE(imp.impression_count, 0) as impressions,
             COALESCE(intr.click_count, 0) as clicks,
             COALESCE(ord.conversion_count, 0) as conversions,
             COALESCE(ord.attributed_revenue, 0.00) as revenue
      FROM campaigns c
      LEFT JOIN (
        SELECT campaign_id, COUNT(id) as impression_count
        FROM campaign_impressions
        GROUP BY campaign_id
      ) imp ON c.id = imp.campaign_id
      LEFT JOIN (
        SELECT campaign_id, COUNT(id) as click_count
        FROM campaign_interactions
        GROUP BY campaign_id
      ) intr ON c.id = intr.campaign_id
      LEFT JOIN (
        SELECT utm_campaign, COUNT(id) as conversion_count, SUM(total_amount) as attributed_revenue
        FROM orders
        WHERE utm_campaign IS NOT NULL
        GROUP BY utm_campaign
      ) ord ON c.code = ord.utm_campaign
      ${where}
      ORDER BY c.start_date DESC
      LIMIT ? OFFSET ?;
    `;

    const [rows] = await pool.query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    // Calculate derived business intelligence metrics
    const campaigns = rows.map(r => {
      const impressions = parseInt(r.impressions, 10) || 0;
      const clicks = parseInt(r.clicks, 10) || 0;
      const conversions = parseInt(r.conversions, 10) || 0;
      const spend = parseFloat(r.actual_spend) || 0.00;
      const revenue = parseFloat(r.revenue) || 0.00;

      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0.00;
      const convRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : 0.00;
      const cpa = conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0.00;
      const roi = spend > 0 ? parseFloat((((revenue - spend) / spend) * 100).toFixed(2)) : 0.00;

      return {
        id: r.id,
        code: r.code,
        name: r.name,
        channel: r.channel,
        targetAudience: r.target_audience,
        budget: parseFloat(r.budget),
        actualSpend: spend,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        impressions,
        clicks,
        conversions,
        revenue,
        ctr,
        conversionRate: convRate,
        cpa,
        roi
      };
    });

    return {
      campaigns,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  async findById(id) {
    const sql = `
      SELECT c.*,
             COALESCE(imp.impression_count, 0) as impressions,
             COALESCE(intr.click_count, 0) as clicks,
             COALESCE(ord.conversion_count, 0) as conversions,
             COALESCE(ord.attributed_revenue, 0.00) as revenue
      FROM campaigns c
      LEFT JOIN (
        SELECT campaign_id, COUNT(id) as impression_count
        FROM campaign_impressions
        GROUP BY campaign_id
      ) imp ON c.id = imp.campaign_id
      LEFT JOIN (
        SELECT campaign_id, COUNT(id) as click_count
        FROM campaign_interactions
        GROUP BY campaign_id
      ) intr ON c.id = intr.campaign_id
      LEFT JOIN (
        SELECT utm_campaign, COUNT(id) as conversion_count, SUM(total_amount) as attributed_revenue
        FROM orders
        WHERE utm_campaign IS NOT NULL
        GROUP BY utm_campaign
      ) ord ON c.code = ord.utm_campaign
      WHERE c.id = ?;
    `;
    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) return null;

    const r = rows[0];
    const impressions = parseInt(r.impressions, 10) || 0;
    const clicks = parseInt(r.clicks, 10) || 0;
    const conversions = parseInt(r.conversions, 10) || 0;
    const spend = parseFloat(r.actual_spend) || 0.00;
    const revenue = parseFloat(r.revenue) || 0.00;

    const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0.00;
    const convRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : 0.00;
    const cpa = conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0.00;
    const roi = spend > 0 ? parseFloat((((revenue - spend) / spend) * 100).toFixed(2)) : 0.00;

    // Daily trends for single campaign
    const [dailyImp] = await pool.query(`
      SELECT DATE(impression_date) as date, COUNT(*) as impressions, SUM(cost) as cost
      FROM campaign_impressions
      WHERE campaign_id = ?
      GROUP BY DATE(impression_date)
      ORDER BY date ASC
      LIMIT 30;
    `, [id]);

    const [dailyClicks] = await pool.query(`
      SELECT DATE(interaction_date) as date, COUNT(*) as clicks
      FROM campaign_interactions
      WHERE campaign_id = ?
      GROUP BY DATE(interaction_date)
      ORDER BY date ASC
      LIMIT 30;
    `, [id]);

    return {
      id: r.id,
      code: r.code,
      name: r.name,
      channel: r.channel,
      targetAudience: r.target_audience,
      budget: parseFloat(r.budget),
      actualSpend: spend,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr,
      conversionRate: convRate,
      cpa,
      roi,
      dailyTrend: {
        impressions: dailyImp,
        clicks: dailyClicks
      }
    };
  }
}

module.exports = new CampaignRepository();
