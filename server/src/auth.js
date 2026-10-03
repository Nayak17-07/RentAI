const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');

const SECRET_KEY = process.env.SECRET_KEY || 'django-insecure-o!q0=y&+y5v47g9c6xi#^40$k=47kcml-9o_h_&u%t4x(@quq9';

function makePassword(password) {
  const salt = crypto.randomBytes(16).toString('base64').replace(/=/g, '');
  const iterations = 1000000;
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${derivedKey.toString('base64')}`;
}

function checkPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('pbkdf2_sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const hash = parts[3];
      const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
      return derivedKey.toString('base64') === hash;
    }
  }
  return password === storedHash;
}

function generateTokens(userId) {
  const now = Math.floor(Date.now() / 1000);
  const accessPayload = {
    user_id: String(userId),
    exp: now + 60 * 60, // 60 mins
    iat: now
  };
  const refreshPayload = {
    user_id: String(userId),
    exp: now + 24 * 60 * 60, // 1 day
    iat: now
  };

  const access = jwt.sign(accessPayload, SECRET_KEY, { algorithm: 'HS256' });
  const refresh = jwt.sign(refreshPayload, SECRET_KEY, { algorithm: 'HS256' });

  return { access, refresh };
}

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ detail: 'Invalid authorization header format.' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
    const db = getDb();
    const user = await db.collection('users').findOne({ _id: decoded.user_id });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = {
      id: user._id,
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || 'customer'
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    try {
      const decoded = jwt.verify(parts[1], SECRET_KEY, { algorithms: ['HS256'] });
      const db = getDb();
      const user = await db.collection('users').findOne({ _id: decoded.user_id });
      if (user) {
        req.user = {
          id: user._id,
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role || 'customer'
        };
      }
    } catch (e) {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

module.exports = {
  SECRET_KEY,
  makePassword,
  checkPassword,
  generateTokens,
  authenticateJWT,
  optionalAuth
};
