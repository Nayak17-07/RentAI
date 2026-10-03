const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const appliancesRoutes = require('./routes/appliances');
const recommendationsRoutes = require('./routes/recommendations');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const rentalsRoutes = require('./routes/rentals');
const paymentsRoutes = require('./routes/payments');
const kycRoutes = require('./routes/kyc');
const adminRoutes = require('./routes/admin');
const ownerRoutes = require('./routes/owner');
const feedbackRoutes = require('./routes/feedback');
const addressesRoutes = require('./routes/addresses');
const conciergeRoutes = require('./routes/concierge');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// Health Check
app.get(['/', '/api/health', '/api/health/'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Rentora Node.js & Express Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes under /api
app.use('/api', authRoutes);
app.use('/api', appliancesRoutes);
app.use('/api', recommendationsRoutes);
app.use('/api', cartRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', rentalsRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', kycRoutes);
app.use('/api', addressesRoutes);
app.use('/api', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', conciergeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
