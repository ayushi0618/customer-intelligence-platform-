/**
 * Express Application Setup
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const campaignRoutes = require('./routes/campaign.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const rfmRoutes = require('./routes/rfm.routes');
const attributionRoutes = require('./routes/attribution.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const mlRoutes = require('./routes/ml.routes');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Multi-Channel Customer Behaviour & Marketing Intelligence System',
    timestamp: new Date().toISOString()
  });
});

// Domain REST Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rfm', rfmRoutes);
app.use('/api/attribution', attributionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ml', mlRoutes);

// Direct alias for predictions
app.use('/api/predictions', mlRoutes);

// Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
