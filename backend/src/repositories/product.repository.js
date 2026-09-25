/**
 * Product & Category Repository
 */

const { pool } = require('../config/database');

class ProductRepository {
  async getCategories() {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC;
    `);
    return rows;
  }

  async findAll({ page = 1, limit = 25, categoryId = null, search = '' }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [cntRows] = await pool.query(`SELECT COUNT(*) as total FROM products p ${where};`, params);
    const total = cntRows[0].total;

    const sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN product_categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?;
    `;
    const [rows] = await pool.query(sql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    return {
      products: rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN product_categories c ON p.category_id = c.id
      WHERE p.id = ?;
    `, [id]);
    return rows[0] || null;
  }
}

module.exports = new ProductRepository();
