/**
 * Order Repository
 */

const { pool } = require('../config/database');

class OrderRepository {
  async findAll({ page = 1, limit = 25, customerId = null, status = '', channel = '', startDate = '', endDate = '' }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (customerId) {
      conditions.push('o.customer_id = ?');
      params.push(customerId);
    }
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (channel) {
      conditions.push('o.channel = ?');
      params.push(channel);
    }
    if (startDate) {
      conditions.push('o.order_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('o.order_date <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [cntRows] = await pool.query(`SELECT COUNT(*) as total FROM orders o ${where};`, params);
    const total = cntRows[0].total;

    const sql = `
      SELECT o.*, c.first_name, c.last_name, c.email as customer_email,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${where}
      GROUP BY o.id
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?;
    `;
    const [rows] = await pool.query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    return {
      orders: rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  async findById(id) {
    const [orderRows] = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?;
    `, [id]);
    if (orderRows.length === 0) return null;
    const order = orderRows[0];

    const [items] = await pool.query(`
      SELECT oi.*, p.name as product_name, p.sku as product_sku, cat.name as category_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN product_categories cat ON p.category_id = cat.id
      WHERE oi.order_id = ?;
    `, [id]);

    const [payments] = await pool.query(`
      SELECT * FROM payments WHERE order_id = ?;
    `, [id]);

    return {
      ...order,
      items,
      payments
    };
  }
}

module.exports = new OrderRepository();
