/**
 * High-Speed Batch Database Seeder for MySQL 8
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { generateDataset } = require('../seeds/generate_data');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ayushi',
  database: process.env.DB_NAME || 'customer_intelligence'
};

function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function bulkInsert(connection, tableName, columns, rows, batchSize = 2000) {
  if (!rows || rows.length === 0) return;
  console.log(`Inserting ${rows.length} rows into ${tableName}...`);

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const placeholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const values = [];

    for (const row of chunk) {
      for (const col of columns) {
        let val = row[col];
        if (val instanceof Date) {
          val = formatDate(val);
        } else if (typeof val === 'boolean') {
          val = val ? 1 : 0;
        } else if (val === undefined) {
          val = null;
        }
        values.push(val);
      }
    }

    const sql = `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES ${placeholders};`;
    await connection.query(sql, values);
  }
}

async function seedDatabase() {
  console.log(`Connecting to MySQL for seeding at ${config.host}:${config.port}...`);
  const connection = await mysql.createConnection(config);

  try {
    console.log('Temporarily disabling foreign key checks for fast clean seed...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Truncate existing tables to avoid duplicate entries
    const tablesToClean = [
      'recommendations', 'attribution_results', 'clv_predictions', 'churn_predictions',
      'customer_segments', 'model_runs', 'rfm_scores', 'feedback', 'support_tickets',
      'sms_events', 'email_events', 'campaign_interactions', 'campaign_impressions',
      'mobile_events', 'website_events', 'website_sessions', 'payments', 'order_items',
      'orders', 'products', 'product_categories', 'customer_preferences', 'customer_addresses',
      'customers', 'user_roles', 'users', 'roles', 'campaigns'
    ];

    for (const tbl of tablesToClean) {
      await connection.query(`TRUNCATE TABLE \`${tbl}\`;`);
    }
    console.log('Cleaned existing tables.');

    // Generate dataset (Scale = 1.0 -> 10,000 customers, 50k+ orders, 100k+ events)
    // Note: Allow CLI flag --scale or default to 1.0
    const scaleArg = process.argv.find(a => a.startsWith('--scale='));
    const scale = scaleArg ? parseFloat(scaleArg.split('=')[1]) : 1.0;
    const seedArg = process.argv.find(a => a.startsWith('--seed='));
    const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : 42;

    const data = generateDataset({ seed, scale });

    // 1. Roles & Users
    await bulkInsert(connection, 'roles', ['id', 'name', 'description'], data.roles);
    await bulkInsert(connection, 'users', ['id', 'username', 'email', 'password_hash', 'first_name', 'last_name', 'is_active'], data.users);
    await bulkInsert(connection, 'user_roles', ['user_id', 'role_id'], data.userRoles);

    // 2. Product Categories & Products
    await bulkInsert(connection, 'product_categories', ['id', 'name', 'slug', 'description'], data.productCategories);
    await bulkInsert(connection, 'products', ['id', 'category_id', 'sku', 'name', 'description', 'price', 'cost', 'stock_quantity', 'is_active'], data.products);

    // 3. Campaigns
    await bulkInsert(connection, 'campaigns', ['id', 'code', 'name', 'channel', 'target_audience', 'budget', 'actual_spend', 'start_date', 'end_date', 'status'], data.campaigns);

    // 4. Customers & Sub-records
    await bulkInsert(connection, 'customers', ['id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth', 'city', 'state', 'country', 'postal_code', 'acquisition_channel', 'preferred_channel', 'status', 'registration_date'], data.customers);
    await bulkInsert(connection, 'customer_addresses', ['id', 'customer_id', 'address_type', 'street', 'city', 'state', 'country', 'postal_code', 'is_default'], data.customerAddresses);
    await bulkInsert(connection, 'customer_preferences', ['customer_id', 'email_opt_in', 'sms_opt_in', 'push_opt_in', 'preferred_language', 'interest_categories'], data.customerPreferences);

    // 5. Orders, Items, Payments
    await bulkInsert(connection, 'orders', ['id', 'order_number', 'customer_id', 'order_date', 'status', 'channel', 'subtotal', 'discount_amount', 'tax_amount', 'shipping_amount', 'total_amount', 'utm_campaign', 'utm_source', 'utm_medium'], data.orders);
    await bulkInsert(connection, 'order_items', ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'total_price'], data.orderItems);
    await bulkInsert(connection, 'payments', ['id', 'order_id', 'payment_method', 'status', 'amount', 'transaction_reference', 'payment_date'], data.payments);

    // 6. Digital Events
    await bulkInsert(connection, 'website_sessions', ['id', 'session_uuid', 'customer_id', 'device_type', 'browser', 'operating_system', 'traffic_source', 'landing_page', 'started_at', 'ended_at', 'page_views_count'], data.websiteSessions);
    await bulkInsert(connection, 'website_events', ['id', 'session_id', 'customer_id', 'event_type', 'product_id', 'page_url', 'event_metadata', 'created_at'], data.websiteEvents);
    await bulkInsert(connection, 'mobile_events', ['id', 'customer_id', 'app_version', 'os_version', 'device_model', 'event_name', 'screen_name', 'event_metadata', 'created_at'], data.mobileEvents);

    // 7. Marketing Events
    await bulkInsert(connection, 'campaign_impressions', ['id', 'campaign_id', 'customer_id', 'impression_date', 'placement', 'cost'], data.campaignImpressions);
    await bulkInsert(connection, 'campaign_interactions', ['id', 'campaign_id', 'customer_id', 'interaction_type', 'interaction_date', 'cost'], data.campaignInteractions);
    await bulkInsert(connection, 'email_events', ['id', 'campaign_id', 'customer_id', 'event_type', 'subject', 'created_at'], data.emailEvents);
    await bulkInsert(connection, 'sms_events', ['id', 'campaign_id', 'customer_id', 'event_type', 'created_at'], data.smsEvents);

    // 8. Support & Feedback
    await bulkInsert(connection, 'support_tickets', ['id', 'ticket_number', 'customer_id', 'category', 'priority', 'status', 'subject', 'opened_at', 'resolved_at', 'satisfaction_score'], data.supportTickets);
    await bulkInsert(connection, 'feedback', ['id', 'customer_id', 'order_id', 'rating', 'nps_score', 'comments', 'submitted_at'], data.feedback);

    console.log('Re-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\nSeed process completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
