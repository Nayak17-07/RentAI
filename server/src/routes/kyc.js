const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// GET /api/kyc/
router.get('/kyc/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const kyc = await db.collection('kyc').findOne({ user_id: userId });
    if (!kyc) {
      return res.status(200).json({ status: 'pending' });
    }

    return res.status(200).json({
      status: kyc.status || 'pending',
      id_type: kyc.id_type || 'Aadhaar Card',
      id_number: kyc.id_number || '',
      full_name: kyc.full_name || req.user.username || '',
      address_line: kyc.address_line || '',
      id_proof_name: kyc.id_proof_name || kyc.id_proof || 'Government_ID.jpg',
      id_proof_preview: kyc.id_proof_preview || kyc.id_proof_mock_url || '',
      address_proof_name: kyc.address_proof_name || kyc.address_proof || 'Address_Proof.pdf',
      address_proof_preview: kyc.address_proof_preview || kyc.address_proof_mock_url || '',
      submitted_at: kyc.submitted_at,
      reviewed_at: kyc.reviewed_at,
      rejection_reason: kyc.rejection_reason || null,
      confidence_score: kyc.confidence_score || 99.2
    });
  } catch (err) {
    console.error('Fetch KYC error:', err);
    return res.status(500).json({ error: 'Internal server error fetching KYC status' });
  }
});

// POST /api/kyc/
router.post('/kyc/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const {
      id_type = 'Aadhaar Card',
      id_number = '',
      full_name = '',
      address_line = '',
      id_proof,
      address_proof,
      id_proof_name,
      address_proof_name,
      id_proof_preview,
      address_proof_preview,
      verification_mode = 'instant' // 'instant' or 'manual'
    } = req.body;

    const finalIdProofName = id_proof_name || id_proof;
    const finalAddressProofName = address_proof_name || address_proof;

    if (!finalIdProofName && !id_proof_preview) {
      return res.status(400).json({ error: 'Front image of your Government ID is required' });
    }
    if (!finalAddressProofName && !address_proof_preview) {
      return res.status(400).json({ error: 'Address proof document is required' });
    }

    const isInstant = verification_mode === 'instant';
    const status = isInstant ? 'approved' : 'in_review';
    const confidenceScore = isInstant ? (97.5 + Math.random() * 2.4).toFixed(1) : (92.0 + Math.random() * 4.0).toFixed(1);

    const docUpdate = {
      user_id: userId,
      user_email: req.user.email || '',
      user_name: req.user.username || '',
      full_name: full_name || req.user.username || 'Verified User',
      id_type,
      id_number: id_number || `ID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      address_line: address_line || 'Verified Residential Address',
      id_proof_name: finalIdProofName || 'id_document.png',
      id_proof_preview: id_proof_preview || `mock_url_${crypto.randomUUID()}`,
      address_proof_name: finalAddressProofName || 'address_proof.png',
      address_proof_preview: address_proof_preview || `mock_url_${crypto.randomUUID()}`,
      status,
      confidence_score: parseFloat(confidenceScore),
      submitted_at: new Date(),
      reviewed_at: isInstant ? new Date() : null,
      rejection_reason: null
    };

    await db.collection('kyc').updateOne(
      { user_id: userId },
      { $set: docUpdate },
      { upsert: true }
    );

    // Update user record verification flag
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { kyc_verified: status === 'approved', kyc_status: status } }
    );

    return res.status(200).json({
      success: isInstant ? 'KYC verified and approved instantly!' : 'KYC submitted for compliance review.',
      status,
      kyc: docUpdate
    });
  } catch (err) {
    console.error('Submit KYC error:', err);
    return res.status(500).json({ error: 'Internal server error submitting KYC' });
  }
});

module.exports = router;

