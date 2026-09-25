/**
 * Comprehensive API Integration Tests
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { pool } = require('../src/config/database');

let server;
let baseUrl;
let authToken;

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  // Log in as admin to get bearer token for tests
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin123!' })
  });
  const data = await loginRes.json();
  authToken = data.data.token;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await pool.end();
});

async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...(options.headers || {})
    }
  });
  const body = await response.json();
  return { status: response.status, body };
}

test('GET /api/customers should return paginated customers list', async () => {
  const res = await api('/api/customers?page=1&limit=10');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.length, 10);
  assert.strictEqual(res.body.meta.total, 10000);
  assert.ok(res.body.data[0].rfm_segment, 'Customer should have RFM segment');
});

test('GET /api/customers/:id/360 should return complete Customer 360 profile', async () => {
  const res = await api('/api/customers/1/360');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.profile, 'Profile section should be present');
  assert.ok(res.body.data.transactions, 'Transactions section should be present');
  assert.ok(res.body.data.digitalEngagement, 'Digital engagement section should be present');
  assert.ok(res.body.data.marketingEngagement, 'Marketing engagement section should be present');
  assert.ok(res.body.data.supportAndFeedback, 'Support and feedback section should be present');
  assert.ok(res.body.data.rfm, 'RFM section should be present');
  assert.ok(Array.isArray(res.body.data.recommendations), 'Recommendations should be an array');
});

test('GET /api/customers/:id/journey should return chronological timeline', async () => {
  const res = await api('/api/customers/1/journey');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.timeline), 'Timeline should be an array');
  assert.ok(res.body.data.timeline.length > 0, 'Timeline should have activity events');
});

test('GET /api/analytics/overview should return real database-backed KPIs', async () => {
  const res = await api('/api/analytics/overview');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.totalRevenue > 1000000, 'Total revenue should be computed from MySQL');
  assert.ok(res.body.data.totalOrders > 10000, 'Total orders should be computed from MySQL');
  assert.ok(res.body.data.averageOrderValue > 0, 'AOV should be computed');
  assert.ok(res.body.data.repeatPurchaseRate > 0, 'Repeat purchase rate should be computed');
});

test('GET /api/analytics/funnel should calculate 5-stage conversion funnel', async () => {
  const res = await api('/api/analytics/funnel');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.stages.length, 5, 'Funnel should have 5 stages');
  assert.strictEqual(res.body.data.stages[0].stage, 'Visitors');
  assert.strictEqual(res.body.data.stages[4].stage, 'Purchase Completed');
  assert.ok(res.body.data.overallConversionRate > 0, 'Conversion rate should be positive');
});

test('GET /api/campaigns should return calculated CTR, CPA, and ROI', async () => {
  const res = await api('/api/campaigns?page=1&limit=5');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.length > 0, 'Campaigns should be listed');
  const camp = res.body.data[0];
  assert.ok('ctr' in camp, 'CTR must be present');
  assert.ok('cpa' in camp, 'CPA must be present');
  assert.ok('roi' in camp, 'ROI must be present');
});

test('GET /api/attribution/compare should return First-Touch, Last-Touch, and Multi-Touch comparison', async () => {
  const res = await api('/api/attribution/compare');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.campaigns), 'Attributed campaigns array should be present');
  assert.ok(Array.isArray(res.body.data.channelSummary), 'Channel summary array should be present');
  assert.ok(res.body.data.methodology, 'Attribution methodology notes should be present');
});

test('GET /api/recommendations should return decision support records', async () => {
  const res = await api('/api/recommendations?page=1&limit=5');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.length > 0, 'Recommendations should be returned');
  const rec = res.body.data[0];
  assert.ok(rec.reason, 'Recommendation must have explainable reason');
  assert.ok(rec.supportingMetrics, 'Recommendation must have supporting metrics');
});

test('PATCH /api/recommendations/:id/status should update recommendation status', async () => {
  // Fetch first recommendation
  const listRes = await api('/api/recommendations?limit=1');
  const firstId = listRes.body.data[0].id;

  const updateRes = await api(`/api/recommendations/${firstId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACCEPTED', notes: 'Enrolled in Q4 marketing campaign' })
  });

  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.body.success, true);
  assert.strictEqual(updateRes.body.data.status, 'ACCEPTED');
  assert.strictEqual(updateRes.body.data.actionNotes, 'Enrolled in Q4 marketing campaign');
});
