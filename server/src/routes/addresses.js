const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// GET /api/addresses/ - Retrieve all saved addresses for logged-in user
router.get('/addresses/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    let addresses = await db.collection('addresses')
      .find({ user_id: userId })
      .sort({ is_default: -1, created_at: -1 })
      .toArray();

    // If no saved addresses found, check if user has a verified KYC record to auto-seed
    if (addresses.length === 0) {
      const kyc = await db.collection('kyc_records').findOne({ user_id: userId });
      const user = await db.collection('users').findOne({ _id: userId });

      if (kyc && kyc.address) {
        const seededAddress = {
          _id: crypto.randomUUID(),
          user_id: userId,
          type: 'Home',
          recipient_name: kyc.full_name || user?.username || 'Customer',
          phone: kyc.phone_num || user?.phone_num || '',
          house_flat: kyc.address?.flat_no || '',
          street_area: kyc.address?.street || '',
          landmark: kyc.address?.landmark || '',
          city: kyc.address?.city || 'Bangalore',
          pincode: kyc.address?.pincode || '560038',
          is_default: true,
          created_at: new Date().toISOString()
        };
        await db.collection('addresses').insertOne(seededAddress);
        addresses = [seededAddress];
      }
    }

    return res.status(200).json(addresses);
  } catch (err) {
    console.error('Fetch addresses error:', err);
    return res.status(500).json({ error: 'Failed to retrieve addresses' });
  }
});

// POST /api/addresses/ - Add a new delivery address
router.post('/addresses/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const {
      type = 'Home',
      recipient_name,
      phone,
      house_flat,
      street_area,
      landmark = '',
      city = 'Bangalore',
      pincode,
      is_default = false
    } = req.body;

    if (!recipient_name || !phone || !house_flat || !street_area || !pincode) {
      return res.status(400).json({
        error: 'Missing required address fields (recipient_name, phone, house_flat, street_area, pincode)'
      });
    }

    // If marked default or first address, unset existing defaults
    const count = await db.collection('addresses').countDocuments({ user_id: userId });
    const shouldBeDefault = is_default || count === 0;

    if (shouldBeDefault) {
      await db.collection('addresses').updateMany(
        { user_id: userId },
        { $set: { is_default: false } }
      );
    }

    const newAddress = {
      _id: crypto.randomUUID(),
      user_id: userId,
      type: ['Home', 'Work', 'Other'].includes(type) ? type : 'Home',
      recipient_name: recipient_name.trim(),
      phone: String(phone).trim(),
      house_flat: house_flat.trim(),
      street_area: street_area.trim(),
      landmark: (landmark || '').trim(),
      city: (city || 'Bangalore').trim(),
      pincode: String(pincode).trim(),
      is_default: shouldBeDefault,
      created_at: new Date().toISOString()
    };

    await db.collection('addresses').insertOne(newAddress);
    return res.status(201).json(newAddress);
  } catch (err) {
    console.error('Create address error:', err);
    return res.status(500).json({ error: 'Failed to save address' });
  }
});

// PATCH /api/addresses/:id/default - Set as default address
router.patch('/addresses/:id/default', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const addressId = req.params.id;

    await db.collection('addresses').updateMany(
      { user_id: userId },
      { $set: { is_default: false } }
    );

    const updateResult = await db.collection('addresses').findOneAndUpdate(
      { _id: addressId, user_id: userId },
      { $set: { is_default: true, updated_at: new Date().toISOString() } },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return res.status(404).json({ error: 'Address not found' });
    }

    return res.status(200).json(updateResult);
  } catch (err) {
    console.error('Set default address error:', err);
    return res.status(500).json({ error: 'Failed to set default address' });
  }
});

// DELETE /api/addresses/:id - Delete an address
router.delete('/addresses/:id', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const addressId = req.params.id;

    const result = await db.collection('addresses').deleteOne({
      _id: addressId,
      user_id: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    return res.status(200).json({ success: true, message: 'Address removed successfully' });
  } catch (err) {
    console.error('Delete address error:', err);
    return res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;
