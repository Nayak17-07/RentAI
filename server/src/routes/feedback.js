const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { SECRET_KEY } = require('../auth');

const router = express.Router();

// Helper to extract user info from Authorization header if present
async function getUserFromHeader(req, db) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
      const user = await db.collection('users').findOne({ _id: payload.user_id });
      if (user) {
        return {
          userId: user._id,
          username: user.username,
          email: user.email
        };
      }
    } catch (e) {
      // ignore invalid token for optional user extraction
    }
  }
  return null;
}

// GET /api/feedback/
router.get('/feedback/', async (req, res) => {
  try {
    const db = getDb();
    const applianceId = req.query.appliance_id;

    const query = {};
    if (applianceId) {
      query.appliance_id = applianceId;
    }

    const feedbacks = await db.collection('feedback').find(query).sort({ created_at: -1 }).toArray();

    const formatted = feedbacks.map(f => ({
      ...f,
      _id: String(f._id),
      created_at: f.created_at instanceof Date ? f.created_at.toISOString() : f.created_at
    }));

    let avgRating = 4.8;
    if (formatted.length > 0) {
      const total = formatted.reduce((sum, f) => sum + (parseFloat(f.rating) || 5), 0);
      avgRating = Math.round((total / formatted.length) * 10) / 10;
    }

    return res.status(200).json({
      feedbacks: formatted,
      total_reviews: formatted.length,
      average_rating: avgRating
    });
  } catch (err) {
    console.error('Fetch feedback error:', err);
    return res.status(500).json({ error: 'Internal server error fetching feedback' });
  }
});

// POST /api/feedback/
router.post('/feedback/', async (req, res) => {
  try {
    const db = getDb();
    const userInfo = await getUserFromHeader(req, db);

    const userId = userInfo ? userInfo.userId : 'guest_user';
    let username = req.body.username || (userInfo ? userInfo.username : 'Verified Renter');

    const { appliance_id, rating = 5, comment = '' } = req.body;
    const numRating = parseInt(rating, 10);

    if (!appliance_id) {
      return res.status(400).json({ error: 'appliance_id is required' });
    }
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const now = new Date();
    const feedbackDoc = {
      _id: crypto.randomUUID(),
      user_id: userId,
      username,
      appliance_id,
      rating: numRating,
      comment,
      created_at: now
    };

    await db.collection('feedback').insertOne(feedbackDoc);

    return res.status(201).json({
      success: 'Review submitted successfully',
      feedback: {
        ...feedbackDoc,
        _id: String(feedbackDoc._id),
        created_at: now.toISOString()
      }
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    return res.status(500).json({ error: 'Internal server error submitting review' });
  }
});

// GET /api/complaints/
router.get('/complaints/', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.query.user_id;
    const isAdmin = String(req.query.admin).toLowerCase() === 'true';

    const query = {};
    if (userId && !isAdmin) {
      query.user_id = userId;
    }

    const complaints = await db.collection('complaints').find(query).sort({ created_at: -1 }).toArray();

    const formatted = complaints.map(c => ({
      ...c,
      _id: String(c._id),
      created_at: c.created_at instanceof Date ? c.created_at.toISOString() : c.created_at,
      resolved_at: c.resolved_at instanceof Date ? c.resolved_at.toISOString() : c.resolved_at
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Fetch complaints error:', err);
    return res.status(500).json({ error: 'Internal server error fetching complaints' });
  }
});

// POST /api/complaints/
router.post('/complaints/', async (req, res) => {
  try {
    const db = getDb();
    const userInfo = await getUserFromHeader(req, db);

    const userId = userInfo ? userInfo.userId : 'guest_user';
    const customerName = req.body.customer_name || (userInfo ? userInfo.username : 'Valued Customer');
    const customerEmail = req.body.customer_email || (userInfo ? userInfo.email : '');

    const { subject, category = 'General Issue', description, priority = 'MEDIUM' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'subject and description are required' });
    }

    const ticketId = `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date();

    const doc = {
      _id: crypto.randomUUID(),
      ticket_id: ticketId,
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      subject,
      category,
      description,
      status: 'OPEN',
      priority,
      created_at: now,
      resolution_notes: ''
    };

    await db.collection('complaints').insertOne(doc);

    return res.status(201).json({
      success: 'Complaint registered successfully',
      complaint: {
        ...doc,
        _id: String(doc._id),
        created_at: now.toISOString()
      }
    });
  } catch (err) {
    console.error('Submit complaint error:', err);
    return res.status(500).json({ error: 'Internal server error registering complaint' });
  }
});

// PATCH /api/complaints/:ticket_id/ or /api/complaints/
router.patch(['/complaints/:ticket_id/', '/complaints/:ticket_id', '/complaints/'], async (req, res) => {
  try {
    const db = getDb();
    const ticketId = req.params.ticket_id || req.body.ticket_id;

    if (!ticketId) {
      return res.status(400).json({ error: 'ticket_id is required' });
    }

    const updates = {
      status: req.body.status || 'RESOLVED',
      resolution_notes: req.body.resolution_notes || 'Resolved by Rentora Support Team',
      resolved_at: new Date()
    };

    const result = await db.collection('complaints').updateOne(
      { $or: [{ ticket_id: ticketId }, { _id: ticketId }] },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(200).json({ success: `Ticket ${ticketId} updated successfully` });
  } catch (err) {
    console.error('Update complaint error:', err);
    return res.status(500).json({ error: 'Internal server error updating complaint' });
  }
});

module.exports = router;
