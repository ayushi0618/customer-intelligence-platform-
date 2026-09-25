/**
 * Authentication and RBAC Integration Tests
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
});

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  return { status: response.status, body: data };
}

test('GET /api/health should return 200 and healthy status', async () => {
  const res = await request('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'healthy');
});

test('POST /api/auth/login should authenticate Admin user with valid credentials', async () => {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'Admin123!' })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.token, 'Token should be present in response');
  assert.strictEqual(res.body.data.user.username, 'admin');
  assert.ok(res.body.data.user.roles.includes('Admin'), 'User should have Admin role');
});

test('POST /api/auth/login should reject invalid credentials with 401', async () => {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'WrongPassword!' })
  });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
});

test('GET /api/auth/me should return 401 when token is missing', async () => {
  const res = await request('/api/auth/me');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/auth/me should return user details when Bearer token is provided', async () => {
  // First login
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'analyst', password: 'Analyst123!' })
  });
  assert.strictEqual(loginRes.status, 200);
  const token = loginRes.body.data.token;

  // Then fetch profile
  const meRes = await request('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.success, true);
  assert.strictEqual(meRes.body.data.username, 'analyst');
  assert.ok(meRes.body.data.roles.includes('Data Analyst'));
});

test('Verify all 4 core roles can authenticate', async () => {
  const accounts = [
    { username: 'admin', pass: 'Admin123!', role: 'Admin' },
    { username: 'marketing', pass: 'Marketing123!', role: 'Marketing Manager' },
    { username: 'analyst', pass: 'Analyst123!', role: 'Data Analyst' },
    { username: 'executive', pass: 'Executive123!', role: 'Executive' }
  ];

  for (const acc of accounts) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: acc.username, password: acc.pass })
    });
    assert.strictEqual(res.status, 200, `Login failed for ${acc.username}`);
    assert.ok(res.body.data.user.roles.includes(acc.role), `Expected role ${acc.role} for ${acc.username}`);
  }
});
