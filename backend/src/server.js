/**
 * Server Entry Point
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    console.log('Testing MySQL database connection...');
    await testConnection();

    app.listen(PORT, () => {
      console.log(`Backend API Server running successfully on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connectivity error:', error);
    process.exit(1);
  }
}

startServer();
