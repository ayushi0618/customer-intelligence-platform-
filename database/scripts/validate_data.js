/**
 * Data Quality & Integrity Validation Script for MySQL 8
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ayushi',
  database: process.env.DB_NAME || 'customer_intelligence'
};

async function validateDatabase() {
  console.log(`Connecting to MySQL database '${config.database}' for validation...`);
  const connection = await mysql.createConnection(config);
  let hasErrors = false;

  try {
    console.log('\n=============================================');
    console.log('1. TABLE ROW COUNTS');
    console.log('=============================================');
    const tables = [
      'roles', 'users', 'user_roles', 'product_categories', 'products', 'campaigns',
      'customers', 'customer_addresses', 'customer_preferences', 'orders', 'order_items',
      'payments', 'website_sessions', 'website_events', 'mobile_events',
      'campaign_impressions', 'campaign_interactions', 'email_events', 'sms_events',
      'support_tickets', 'feedback'
    ];

    const counts = {};
    for (const tbl of tables) {
      const [res] = await connection.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\`;`);
      counts[tbl] = res[0].cnt;
      console.log(`  - ${tbl.padEnd(24)}: ${counts[tbl].toLocaleString()} rows`);
    }

    if (counts.customers < 100) {
      console.error('ERROR: Customer count is abnormally low!');
      hasErrors = true;
    }
    if (counts.orders < 100) {
      console.error('ERROR: Order count is abnormally low!');
      hasErrors = true;
    }

    console.log('\n=============================================');
    console.log('2. REFERENTIAL INTEGRITY (ORPHAN CHECKS)');
    console.log('=============================================');
    const orphanChecks = [
      { name: 'order_items without order', sql: 'SELECT COUNT(*) as cnt FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL' },
      { name: 'order_items without product', sql: 'SELECT COUNT(*) as cnt FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE p.id IS NULL' },
      { name: 'orders without customer', sql: 'SELECT COUNT(*) as cnt FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE c.id IS NULL' },
      { name: 'payments without order', sql: 'SELECT COUNT(*) as cnt FROM payments p LEFT JOIN orders o ON p.order_id = o.id WHERE o.id IS NULL' },
      { name: 'website_events without session', sql: 'SELECT COUNT(*) as cnt FROM website_events we LEFT JOIN website_sessions ws ON we.session_id = ws.id WHERE ws.id IS NULL' },
      { name: 'campaign_interactions without campaign', sql: 'SELECT COUNT(*) as cnt FROM campaign_interactions ci LEFT JOIN campaigns c ON ci.campaign_id = c.id WHERE c.id IS NULL' },
      { name: 'support_tickets without customer', sql: 'SELECT COUNT(*) as cnt FROM support_tickets st LEFT JOIN customers c ON st.customer_id = c.id WHERE c.id IS NULL' }
    ];

    for (const check of orphanChecks) {
      const [res] = await connection.query(check.sql);
      const cnt = res[0].cnt;
      if (cnt > 0) {
        console.error(`  FAIL: ${check.name} found ${cnt} orphaned records!`);
        hasErrors = true;
      } else {
        console.log(`  PASS: ${check.name} (0 orphans)`);
      }
    }

    console.log('\n=============================================');
    console.log('3. BUSINESS LOGIC & SANITY CHECKS');
    console.log('=============================================');
    const sanityChecks = [
      { name: 'Negative order total amounts', sql: 'SELECT COUNT(*) as cnt FROM orders WHERE total_amount < 0' },
      { name: 'Negative product prices', sql: 'SELECT COUNT(*) as cnt FROM products WHERE price < 0' },
      { name: 'Order total mismatch > $1.00', sql: `
        SELECT COUNT(*) as cnt FROM (
          SELECT o.id, o.total_amount, (o.subtotal - o.discount_amount + o.tax_amount + o.shipping_amount) as calc_total
          FROM orders o
        ) t WHERE ABS(t.total_amount - t.calc_total) > 1.00`
      },
      { name: 'Null customer emails', sql: 'SELECT COUNT(*) as cnt FROM customers WHERE email IS NULL OR email = ""' },
      { name: 'Duplicate customer emails', sql: 'SELECT email, COUNT(*) as cnt FROM customers GROUP BY email HAVING cnt > 1' }
    ];

    for (const check of sanityChecks) {
      const [res] = await connection.query(check.sql);
      const cnt = check.name.includes('Duplicate') ? res.length : res[0].cnt;
      if (cnt > 0) {
        console.error(`  FAIL: ${check.name} detected ${cnt} issues!`);
        hasErrors = true;
      } else {
        console.log(`  PASS: ${check.name} (0 issues)`);
      }
    }

    console.log('\n=============================================');
    console.log('4. BEHAVIORAL & DISTRIBUTION SUMMARY');
    console.log('=============================================');
    const [revRes] = await connection.query('SELECT SUM(total_amount) as total_rev, AVG(total_amount) as aov, COUNT(*) as order_cnt FROM orders;');
    console.log(`  - Total Revenue: $${parseFloat(revRes[0].total_rev).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`  - Total Orders:  ${revRes[0].order_cnt.toLocaleString()}`);
    console.log(`  - Overall AOV:   $${parseFloat(revRes[0].aov).toFixed(2)}`);

    const [funnelRes] = await connection.query(`
      SELECT event_type, COUNT(*) as cnt 
      FROM website_events 
      GROUP BY event_type 
      ORDER BY FIELD(event_type, 'PAGE_VIEW', 'PRODUCT_VIEW', 'SEARCH', 'ADD_TO_CART', 'CHECKOUT_START', 'PURCHASE');
    `);
    console.log('\n  Funnel Events Distribution:');
    funnelRes.forEach(f => console.log(`    * ${f.event_type.padEnd(16)}: ${f.cnt.toLocaleString()}`));

    console.log('\n=============================================');
    if (hasErrors) {
      console.error('DATA VALIDATION FAILED WITH ERRORS!');
      process.exit(1);
    } else {
      console.log('DATA VALIDATION PASSED ALL INTEGRITY CHECKS SUCCESSFULLY.');
    }
  } catch (err) {
    console.error('Validation script error:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

validateDatabase();
