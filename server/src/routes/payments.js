const express = require('express');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// GET /api/payments/
router.get('/payments/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const payments = await db.collection('payments')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    const formatted = payments.map(p => ({
      ...p,
      _id: String(p._id),
      created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Fetch payments error:', err);
    return res.status(500).json({ error: 'Internal server error fetching payments' });
  }
});

// GET /api/payments/:transaction_id/
router.get('/payments/:transaction_id/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { transaction_id } = req.params;

    let payment = await db.collection('payments').findOne({ transaction_id, user_id: userId });
    if (!payment) {
      payment = await db.collection('payments').findOne({
        $or: [{ invoice_number: transaction_id }, { _id: transaction_id }],
        user_id: userId
      });
    }

    if (!payment) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    payment._id = String(payment._id);
    if (payment.created_at instanceof Date) {
      payment.created_at = payment.created_at.toISOString();
    }

    return res.status(200).json(payment);
  } catch (err) {
    console.error('Fetch invoice error:', err);
    return res.status(500).json({ error: 'Internal server error fetching invoice' });
  }
});

module.exports = router;
