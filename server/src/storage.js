const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_ROOT = path.resolve(__dirname, '../public/uploads');

// Ensure root uploads directory exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
};

const MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF...WEBP
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] } // %PDF
];

/**
 * Validates buffer magic bytes against recognized safe file signatures.
 */
function validateMagicBytes(buffer) {
  for (const sig of MAGIC_BYTES) {
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return sig.mime;
  }
  return null;
}

/**
 * Sanitizes and safely writes a base64 encoded file to disk storage.
 * Enforces size limits, magic-byte MIME validation, and returns normalized URLs.
 *
 * @param {Object} params
 * @param {string} params.base64Data - Base64 data URI or raw base64 string
 * @param {string} [params.subfolder='kyc'] - Storage subfolder
 * @param {string} [params.prefix='doc'] - Filename prefix
 * @param {string} [params.userId='anon'] - User identifier for tracing
 * @param {number} [params.maxBytes=5242880] - Max allowed file size in bytes (default 5MB)
 * @returns {string} Relative URL path (e.g., '/uploads/kyc/doc_123_abc.jpg')
 */
function saveBase64File({
  base64Data,
  subfolder = 'kyc',
  prefix = 'doc',
  userId = 'anon',
  maxBytes = 5 * 1024 * 1024 // 5 MB
}) {
  if (!base64Data || typeof base64Data !== 'string') {
    return '';
  }

  // Already a saved URL path
  if (base64Data.startsWith('/uploads/') || base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  // Extract base64 payload and declared MIME
  let cleanBase64 = base64Data;
  let declaredMime = null;
  const dataUriMatch = base64Data.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (dataUriMatch) {
    declaredMime = dataUriMatch[1].toLowerCase();
    cleanBase64 = dataUriMatch[2];
  }

  const buffer = Buffer.from(cleanBase64.trim(), 'base64');

  // Enforce size limit
  if (buffer.length > maxBytes) {
    throw new Error(`File exceeds maximum allowed size of ${(maxBytes / (1024 * 1024)).toFixed(1)}MB.`);
  }

  // Validate magic bytes
  const verifiedMime = validateMagicBytes(buffer) || declaredMime;
  if (!verifiedMime || !MIME_EXTENSION_MAP[verifiedMime]) {
    throw new Error('Unsupported or unsafe file type. Allowed formats: JPG, PNG, WEBP, PDF.');
  }

  const ext = MIME_EXTENSION_MAP[verifiedMime];
  const targetDir = path.join(UPLOADS_ROOT, subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate collision-resistant cryptographically random filename
  const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const filename = `${prefix}_${safeId}_${Date.now()}_${randomSuffix}.${ext}`;
  const filePath = path.join(targetDir, filename);

  fs.writeFileSync(filePath, buffer);

  // Return clean, environment-agnostic relative URL
  return `/uploads/${subfolder}/${filename}`;
}

module.exports = {
  saveBase64File,
  UPLOADS_ROOT
};
