/**
 * Marketing Attribution Engine
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 *
 * Implements:
 * 1. First-Touch Attribution (100% weight to initial customer touchpoint)
 * 2. Last-Touch Attribution (100% weight to last touchpoint immediately preceding order)
 * 3. Multi-Touch Linear Attribution (Equal weight 1/N across all prior touchpoints in lookback window)
 */

const { pool } = require('../config/database');

class AttributionService {
  /**
   * Recalculates and persists attribution results across all 3 models
   */
  async recalculate({ lookbackDays = 60 } = {}) {
    console.log(`Starting marketing attribution recalculation with ${lookbackDays}-day lookback window...`);

    // Clean existing attribution results
    await pool.query('TRUNCATE TABLE attribution_results;');

    // 1. Fetch orders with their customer and order date
    const [orders] = await pool.query(`
      SELECT id, customer_id, order_date, total_amount
      FROM orders
      ORDER BY order_date ASC;
    `);

    // 2. Fetch all campaign interactions (clicks)
    const [interactions] = await pool.query(`
      SELECT id, campaign_id, customer_id, interaction_date
      FROM campaign_interactions
      ORDER BY interaction_date ASC;
    `);

    // Group interactions by customer
    const custInteractions = new Map();
    for (const intr of interactions) {
      if (!custInteractions.has(intr.customer_id)) {
        custInteractions.set(intr.customer_id, []);
      }
      custInteractions.get(intr.customer_id).push(intr);
    }

    const attributionRecords = [];
    const lookbackMs = lookbackDays * 86400000;

    for (const ord of orders) {
      const allIntrs = custInteractions.get(ord.customer_id) || [];
      const ordTime = new Date(ord.order_date).getTime();
      const minTime = ordTime - lookbackMs;

      // Filter touchpoints occurring before order within lookback
      const qualifying = allIntrs.filter(i => {
        const t = new Date(i.interaction_date).getTime();
        return t <= ordTime && t >= minTime;
      });

      if (qualifying.length === 0) continue;

      const revenue = parseFloat(ord.total_amount);

      // Model 1: First Touch
      const first = qualifying[0];
      attributionRecords.push([
        ord.id,
        first.campaign_id,
        'FIRST_TOUCH',
        new Date(first.interaction_date).toISOString().slice(0, 19).replace('T', ' '),
        1.0000,
        revenue
      ]);

      // Model 2: Last Touch
      const last = qualifying[qualifying.length - 1];
      attributionRecords.push([
        ord.id,
        last.campaign_id,
        'LAST_TOUCH',
        new Date(last.interaction_date).toISOString().slice(0, 19).replace('T', ' '),
        1.0000,
        revenue
      ]);

      // Model 3: Multi-Touch (Linear)
      // Extract unique campaigns in the path
      const uniqueCampaigns = [...new Set(qualifying.map(q => q.campaign_id))];
      const weight = parseFloat((1.0 / uniqueCampaigns.length).toFixed(4));
      const attributedRev = parseFloat((revenue / uniqueCampaigns.length).toFixed(2));

      for (const campId of uniqueCampaigns) {
        const touch = qualifying.find(q => q.campaign_id === campId);
        attributionRecords.push([
          ord.id,
          campId,
          'MULTI_TOUCH',
          new Date(touch.interaction_date).toISOString().slice(0, 19).replace('T', ' '),
          weight,
          attributedRev
        ]);
      }
    }

    // Batch insert attribution records
    const batchSize = 3000;
    for (let i = 0; i < attributionRecords.length; i += batchSize) {
      const chunk = attributionRecords.slice(i, i + batchSize);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, NOW())').join(', ');
      const flat = chunk.flat();

      const sql = `
        INSERT INTO attribution_results
          (order_id, campaign_id, attribution_model, touchpoint_timestamp, weight, attributed_revenue, calculated_at)
        VALUES ${placeholders};
      `;
      await pool.query(sql, flat);
    }

    console.log(`Attribution recalculation generated ${attributionRecords.length} records.`);
    return {
      totalAttributedTouchpoints: attributionRecords.length,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Compare First Touch vs Last Touch vs Multi Touch by Campaign & Channel
   */
  async getComparison() {
    const [rows] = await pool.query(`
      SELECT c.id as campaign_id, c.code, c.name, c.channel, c.actual_spend,
             COALESCE(SUM(CASE WHEN ar.attribution_model = 'FIRST_TOUCH' THEN ar.attributed_revenue END), 0.00) as first_touch_revenue,
             COALESCE(SUM(CASE WHEN ar.attribution_model = 'LAST_TOUCH' THEN ar.attributed_revenue END), 0.00) as last_touch_revenue,
             COALESCE(SUM(CASE WHEN ar.attribution_model = 'MULTI_TOUCH' THEN ar.attributed_revenue END), 0.00) as multi_touch_revenue,
             COUNT(DISTINCT CASE WHEN ar.attribution_model = 'FIRST_TOUCH' THEN ar.order_id END) as first_touch_orders,
             COUNT(DISTINCT CASE WHEN ar.attribution_model = 'LAST_TOUCH' THEN ar.order_id END) as last_touch_orders,
             COUNT(DISTINCT CASE WHEN ar.attribution_model = 'MULTI_TOUCH' THEN ar.order_id END) as multi_touch_orders
      FROM campaigns c
      LEFT JOIN attribution_results ar ON c.id = ar.campaign_id
      GROUP BY c.id
      ORDER BY multi_touch_revenue DESC;
    `);

    const campaigns = rows.map(r => {
      const spend = parseFloat(r.actual_spend) || 0.00;
      const ftRev = parseFloat(r.first_touch_revenue);
      const ltRev = parseFloat(r.last_touch_revenue);
      const mtRev = parseFloat(r.multi_touch_revenue);

      return {
        campaignId: r.campaign_id,
        code: r.code,
        name: r.name,
        channel: r.channel,
        actualSpend: spend,
        firstTouch: {
          revenue: ftRev,
          orders: parseInt(r.first_touch_orders, 10),
          roi: spend > 0 ? parseFloat((((ftRev - spend) / spend) * 100).toFixed(2)) : 0.00
        },
        lastTouch: {
          revenue: ltRev,
          orders: parseInt(r.last_touch_orders, 10),
          roi: spend > 0 ? parseFloat((((ltRev - spend) / spend) * 100).toFixed(2)) : 0.00
        },
        multiTouch: {
          revenue: mtRev,
          orders: parseInt(r.multi_touch_orders, 10),
          roi: spend > 0 ? parseFloat((((mtRev - spend) / spend) * 100).toFixed(2)) : 0.00
        }
      };
    });

    // Channel summaries across models
    const channelMap = {};
    for (const c of campaigns) {
      if (!channelMap[c.channel]) {
        channelMap[c.channel] = { channel: c.channel, spend: 0, firstTouchRevenue: 0, lastTouchRevenue: 0, multiTouchRevenue: 0 };
      }
      channelMap[c.channel].spend += c.actualSpend;
      channelMap[c.channel].firstTouchRevenue += c.firstTouch.revenue;
      channelMap[c.channel].lastTouchRevenue += c.lastTouch.revenue;
      channelMap[c.channel].multiTouchRevenue += c.multiTouch.revenue;
    }

    const channelSummary = Object.values(channelMap).map(ch => ({
      channel: ch.channel,
      spend: parseFloat(ch.spend.toFixed(2)),
      firstTouchRevenue: parseFloat(ch.firstTouchRevenue.toFixed(2)),
      lastTouchRevenue: parseFloat(ch.lastTouchRevenue.toFixed(2)),
      multiTouchRevenue: parseFloat(ch.multiTouchRevenue.toFixed(2))
    }));

    return {
      campaigns,
      channelSummary,
      methodology: {
        firstTouch: 'Credits 100% of order value to the earliest campaign interaction within the lookback window.',
        lastTouch: 'Credits 100% of order value to the campaign interaction occurring immediately prior to conversion.',
        multiTouch: 'Linear model allocating equal fractional credit to all distinct campaigns in the customer path.',
        disclaimer: 'Marketing attribution is an analytical allocation methodology, not a causal proof.'
      }
    };
  }
}

module.exports = new AttributionService();
