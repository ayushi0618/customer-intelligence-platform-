/**
 * Database Migration Runner for MySQL 8
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.example') });
}

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ayushi',
  database: process.env.DB_NAME || 'customer_intelligence',
  multipleStatements: true
};

async function runMigration() {
  console.log(`Connecting to MySQL host at ${config.host}:${config.port}...`);
  
  // 1. Initial connection without database to create if not exists
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true
    });
    
    console.log(`Ensuring database '${config.database}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
  } catch (err) {
    console.error('Failed to initialize database connection:', err.message);
    process.exit(1);
  }

  // 2. Connect to the target database
  try {
    connection = await mysql.createConnection(config);
    console.log(`Connected to database '${config.database}'. Running migrations...`);

    const migrationFile = path.resolve(__dirname, '../migrations/001_initial_schema.sql');
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found at ${migrationFile}`);
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
    await connection.query(sql);
    console.log('Migration 001_initial_schema.sql executed successfully.');

    // 3. Verify created tables
    const [rows] = await connection.query('SHOW TABLES;');
    const tableKey = Object.keys(rows[0] || {})[0];
    const tables = rows.map(r => r[tableKey]);

    console.log(`\nVerified ${tables.length} tables in '${config.database}':`);
    tables.forEach(t => console.log(`  - ${t}`));

    await connection.end();
    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runMigration();
