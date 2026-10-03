const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { makePassword, checkPassword, generateTokens, SECRET_KEY, authenticateJWT } = require('../auth');

const router = express.Router();

// POST /api/users/ (User Registration)
router.post('/users/', async (req, res) => {
  try {
    const { username, email, password, phone_num, role } = req.body;
    const db = getDb();

    if (!username || !email || !password) {
      return res.status(400).json({ error: ['Username, email, and password are required'] });
    }

    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: ['Username already exists'] });
    }

    const existingEmail = await db.collection('users').findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: ['Email already exists'] });
    }

    const userId = crypto.randomUUID();
    const userDoc = {
      _id: userId,
      username,
      email,
      password: makePassword(password),
      phone_num: phone_num || '',
      role: role || 'customer',
      created_at: new Date()
    };

    await db.collection('users').insertOne(userDoc);
    return res.status(201).json({ success: 'Account created' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: ['Internal server error during registration'] });
  }
});

// POST /api/token/ (Login)
router.post('/token/', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' });
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ username });

    if (user && checkPassword(password, user.password)) {
      const tokens = generateTokens(user._id);
      return res.status(200).json({
        ...tokens,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role || 'customer'
        }
      });
    }

    return res.status(401).json({ detail: 'No active account found with the given credentials' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ detail: 'Internal server error during login' });
  }
});

// POST /api/token/refresh/ (Token Refresh)
router.post('/token/refresh/', async (req, res) => {
  try {
    const { refresh } = req.body;
    if (!refresh) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    try {
      const payload = jwt.verify(refresh, SECRET_KEY, { algorithms: ['HS256'] });
      const tokens = generateTokens(payload.user_id);
      return res.status(200).json(tokens);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expired' });
      }
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error during token refresh' });
  }
});

// POST /api/auth/password-reset-request/ (Module 1: Password Reset Request)
router.post('/auth/password-reset-request/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found registered with this email' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins

    await db.collection('password_resets').updateOne(
      { email },
      {
        $set: {
          otp,
          created_at: now,
          expires_at: expiresAt
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: 'Verification code has been sent to your email',
      email,
      mock_otp: otp
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/password-reset-confirm/ (Module 1: Password Reset Confirm)
router.post('/auth/password-reset-confirm/', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email, verification OTP code, and new password are required' });
    }

    const db = getDb();
    const record = await db.collection('password_resets').findOne({ email, otp: String(otp).trim() });
    if (!record) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one' });
    }

    await db.collection('users').updateOne(
      { email },
      { $set: { password: makePassword(new_password) } }
    );

    await db.collection('password_resets').deleteOne({ email });

    return res.status(200).json({
      success: 'Password reset successfully! You can now log in with your new credentials.'
    });
  } catch (err) {
    console.error('Password reset confirm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me/ (Get current authenticated user profile & active role)
router.get('/auth/me/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const user = await db.collection('users').findOne(
      { _id: req.user.id },
      { projection: { password: 0 } }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ error: 'Internal server error fetching user profile' });
  }
});

// PATCH /api/auth/switch-role/ (Switch active role between customer, owner, and admin)
router.patch('/auth/switch-role/', authenticateJWT, async (req, res) => {
  try {
    const { role, admin_code } = req.body;
    const allowedRoles = ['customer', 'owner', 'admin'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (customer, owner, admin)' });
    }

    // Enterprise Security: Restrict Admin promotion behind Admin Security Passcode
    if (role === 'admin' && req.user.role !== 'admin') {
      const validAdminPasscode = process.env.ADMIN_SECURITY_KEY || 'admin123';
      if (!admin_code || admin_code !== validAdminPasscode) {
        return res.status(403).json({ 
          error: 'Restricted Access: Valid Admin Authorization Passcode is required to access the Admin Console.' 
        });
      }
    }

    const db = getDb();
    await db.collection('users').updateOne(
      { _id: req.user.id },
      { $set: { role, updated_at: new Date() } }
    );

    const updated = await db.collection('users').findOne(
      { _id: req.user.id },
      { projection: { password: 0 } }
    );

    return res.status(200).json({
      success: `Switched active role to ${role}`,
      user: updated
    });
  } catch (err) {
    console.error('Switch role error:', err);
    return res.status(500).json({ error: 'Internal server error switching role' });
  }
});

module.exports = router;
