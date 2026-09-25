/**
 * MySQL 8 Connection Pool Configuration
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ayushi',
  database: process.env.DB_NAME || 'customer_intelligence',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00'
};

const pool = mysql.createPool(poolConfig);

// Helper function to test database connectivity
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`Successfully connected to MySQL database: ${poolConfig.database} on ${poolConfig.host}:${poolConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection
};
