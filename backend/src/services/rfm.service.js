/**
 * Deterministic RFM Analysis & Segmentation Engine
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const { pool } = require('../config/database');

class RfmService {
  /**
   * Assign deterministic segment name based on R, F, M quintiles
   */
  mapSegment(r, f, m) {
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    if (r >= 3 && f >= 3 && m >= 3) return 'Loyal Customers';
    if (r >= 4 && f <= 3 && m >= 2) return 'Potential Loyalists';
    if (r >= 4 && f === 1) return 'New Customers';
    if (r === 3 && f <= 3) return 'Need Attention';
    if (r <= 2 && f >= 2 && m >= 2) return 'At Risk';
    return 'Lost Customers';
  }

  /**
   * Recalculates RFM scores for all customers using MySQL order history and updates rfm_scores table
   */
  async recalculate() {
    console.log('Starting deterministic RFM recalculation across all customers...');

    // 1. Fetch raw Recency, Frequency, and Monetary from orders
    const [rawCustomers] = await pool.query(`
      SELECT c.id as customer_id,
             COALESCE(DATEDIFF(NOW(), MAX(o.order_date)), 999) as recency_days,
             COUNT(o.id) as frequency_count,
             COALESCE(SUM(o.total_amount), 0.00) as monetary_total
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id;
    `);

    if (rawCustomers.length === 0) return { updatedCount: 0 };

    // 2. Compute quintile thresholds (using sort and quantile slicing)
    const recencies = rawCustomers.map(c => c.recency_days).sort((a, b) => a - b);
    const frequencies = rawCustomers.map(c => c.frequency_count).sort((a, b) => a - b);
    const monetaries = rawCustomers.map(c => parseFloat(c.monetary_total)).sort((a, b) => a - b);

    const getQuintile = (val, sortedArr, inverse = false) => {
      const n = sortedArr.length;
      let rank = 1;
      for (let i = 0; i < n; i++) {
        if (val <= sortedArr[i]) {
          rank = Math.ceil(((i + 1) / n) * 5);
          break;
        }
      }
      rank = Math.min(5, Math.max(1, rank));
      return inverse ? (6 - rank) : rank; // For recency: lower days is better -> score 5
    };

    // 3. Score each customer and assign segment
    const scoredRows = rawCustomers.map(c => {
      const r = getQuintile(c.recency_days, recencies, true); // lower recency days = higher score
      const f = getQuintile(c.frequency_count, frequencies, false);
      const m = getQuintile(parseFloat(c.monetary_total), monetaries, false);
      const rfmCell = `${r}${f}${m}`;
      const segment = this.mapSegment(r, f, m);

      return [
        c.customer_id,
        c.recency_days,
        c.frequency_count,
        c.monetary_total,
        r,
        f,
        m,
        rfmCell,
        segment
      ];
    });

    // 4. Batch upsert into rfm_scores table
    const batchSize = 2500;
    for (let i = 0; i < scoredRows.length; i += batchSize) {
      const chunk = scoredRows.slice(i, i + batchSize);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())').join(', ');
      const flatValues = chunk.flat();

      const sql = `
        INSERT INTO rfm_scores 
          (customer_id, recency_days, frequency_count, monetary_total, r_score, f_score, m_score, rfm_cell, segment_name, calculated_at)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          recency_days = VALUES(recency_days),
          frequency_count = VALUES(frequency_count),
          monetary_total = VALUES(monetary_total),
          r_score = VALUES(r_score),
          f_score = VALUES(f_score),
          m_score = VALUES(m_score),
          rfm_cell = VALUES(rfm_cell),
          segment_name = VALUES(segment_name),
          calculated_at = NOW();
      `;

      await pool.query(sql, flatValues);
    }

    console.log(`RFM recalculation completed for ${scoredRows.length} customers.`);
    return {
      updatedCount: scoredRows.length,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * RFM Overview Summary & Segment Distribution
   */
  async getOverview() {
    const [rows] = await pool.query(`
      SELECT segment_name,
             COUNT(id) as customer_count,
             COALESCE(SUM(monetary_total), 0.00) as total_revenue,
             COALESCE(AVG(monetary_total), 0.00) as avg_monetary,
             COALESCE(AVG(frequency_count), 0) as avg_frequency,
             COALESCE(AVG(recency_days), 0) as avg_recency_days
      FROM rfm_scores
      GROUP BY segment_name
      ORDER BY total_revenue DESC;
    `);

    const [totals] = await pool.query(`
      SELECT COUNT(id) as total_customers,
             COALESCE(SUM(monetary_total), 0.00) as grand_revenue,
             AVG(r_score) as avg_r,
             AVG(f_score) as avg_f,
             AVG(m_score) as avg_m
      FROM rfm_scores;
    `);

    return {
      totals: {
        totalCustomers: totals[0].total_customers,
        totalRevenue: parseFloat(totals[0].grand_revenue),
        averageRScore: parseFloat(parseFloat(totals[0].avg_r || 0).toFixed(2)),
        averageFScore: parseFloat(parseFloat(totals[0].avg_f || 0).toFixed(2)),
        averageMScore: parseFloat(parseFloat(totals[0].avg_m || 0).toFixed(2))
      },
      segments: rows.map(r => ({
        segmentName: r.segment_name,
        customerCount: parseInt(r.customer_count, 10),
        totalRevenue: parseFloat(r.total_revenue),
        avgMonetary: parseFloat(parseFloat(r.avg_monetary).toFixed(2)),
        avgFrequency: parseFloat(parseFloat(r.avg_frequency).toFixed(1)),
        avgRecencyDays: Math.round(r.avg_recency_days)
      }))
    };
  }

  /**
   * RFM 5x5 Matrix Cell Distribution
   */
  async getDistribution() {
    const [rows] = await pool.query(`
      SELECT r_score, f_score, 
             COUNT(id) as customer_count, 
             SUM(monetary_total) as total_revenue
      FROM rfm_scores
      GROUP BY r_score, f_score
      ORDER BY r_score DESC, f_score ASC;
    `);

    return rows.map(r => ({
      rScore: r.r_score,
      fScore: r.f_score,
      customerCount: parseInt(r.customer_count, 10),
      totalRevenue: parseFloat(r.total_revenue)
    }));
  }
}

module.exports = new RfmService();
