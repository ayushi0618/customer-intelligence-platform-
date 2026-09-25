/**
 * User Repository
 * Parameterized MySQL queries for users and roles
 */

const { pool } = require('../config/database');

class UserRepository {
  async findByUsername(username) {
    const sql = `
      SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
             GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = ?
      GROUP BY u.id;
    `;
    const [rows] = await pool.query(sql, [username]);
    if (rows.length === 0) return null;
    const user = rows[0];
    return {
      ...user,
      roles: user.roles ? user.roles.split(',') : []
    };
  }

  async findById(id) {
    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active, u.last_login_at,
             GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id;
    `;
    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) return null;
    const user = rows[0];
    return {
      ...user,
      roles: user.roles ? user.roles.split(',') : []
    };
  }

  async updateLastLogin(id) {
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?;', [id]);
  }
}

module.exports = new UserRepository();
