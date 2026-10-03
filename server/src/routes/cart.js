const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// GET /api/cart/
router.get('/cart/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const cartItems = await db.collection('carts').find({ user_id: userId }).toArray();
    const result = [];

    for (const item of cartItems) {
      const app = await db.collection('appliances').findOne({ appliance_id: item.appliance_id });
      if (app) {
        app._id = String(app._id);
        result.push({
          cart_item_id: String(item._id),
          appliance: app,
          tenure: item.tenure || '3',
          added_at: item.added_at
        });
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Fetch cart error:', err);
    return res.status(500).json({ error: 'Internal server error fetching cart' });
  }
});

// POST /api/cart/
router.post('/cart/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { appliance_id, tenure = '3', bundle_data } = req.body;

    if (!appliance_id) {
      return res.status(400).json({ error: 'appliance_id is required' });
    }

    if (bundle_data) {
      const existingApp = await db.collection('appliances').findOne({ appliance_id });
      if (!existingApp) {
        const bundleDoc = {
          ...bundle_data,
          _id: crypto.randomUUID(),
          stock_quantity: 50,
          available_cities: ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune']
        };
        await db.collection('appliances').insertOne(bundleDoc);
      }
    }

    const existing = await db.collection('carts').findOne({ user_id: userId, appliance_id });
    if (existing) {
      await db.collection('carts').updateOne(
        { _id: existing._id },
        { $set: { tenure } }
      );
      return res.status(200).json({ message: 'Cart item updated' });
    }

    await db.collection('carts').insertOne({
      _id: crypto.randomUUID(),
      user_id: userId,
      appliance_id,
      tenure,
      added_at: new Date()
    });

    return res.status(201).json({ success: 'Added to cart' });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ error: 'Internal server error adding to cart' });
  }
});

// DELETE /api/cart/
router.delete('/cart/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { appliance_id } = req.body;

    if (appliance_id) {
      await db.collection('carts').deleteOne({ user_id: userId, appliance_id });
    } else {
      await db.collection('carts').deleteMany({ user_id: userId });
    }

    return res.status(200).json({ success: 'Removed from cart' });
  } catch (err) {
    console.error('Delete from cart error:', err);
    return res.status(500).json({ error: 'Internal server error deleting from cart' });
  }
});

module.exports = router;
