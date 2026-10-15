import Tesseract from 'tesseract.js';

/**
 * Aadhaar Card OCR Inspector
 * Runs Tesseract in the browser to scan an Aadhaar card image and verify:
 *   1. Text density (not a blank or irrelevant image)
 *   2. UIDAI / Government of India landmark keywords
 *   3. Digit sequence cross-match with the provided Aadhaar number
 */
/**
 * In-browser canvas preprocessor to improve Tesseract OCR accuracy:
 * Converts input image to optimal grayscale and stretches dynamic range (contrast boost)
 * to sharpen text landmarks and eliminate camera glare/shadows.
 */
async function preprocessImageForOcr(imageSource) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return imageSource;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageSource);

        let w = img.width;
        let h = img.height;
        const targetWidth = 1200;
        if (w > 0 && (w > 2000 || w < 800)) {
          const ratio = targetWidth / w;
          w = targetWidth;
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Grayscale conversion & dynamic contrast normalization
        let minLum = 255;
        let maxLum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const lum = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }

        const range = maxLum - minLum || 1;
        for (let i = 0; i < data.length; i += 4) {
          const lum = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
          const enhanced = Math.min(255, Math.max(0, ((lum - minLum) / range) * 255));
          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(imageSource);
      }
    };
    img.onerror = () => resolve(imageSource);
    img.src = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
  });
}

export async function verifyDocumentOcr(imageSource, idType = 'Aadhaar Card', expectedAadhaar = '', onProgress) {
  try {
    if (!imageSource) {
      return { isValid: false, error: 'No image provided for OCR scan.' };
    }

    // High-accuracy contrast enhancement on canvas before running Tesseract
    const enhancedSource = await preprocessImageForOcr(imageSource);

    const result = await Tesseract.recognize(enhancedSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 85) + 10); // 10–95%
        }
      }
    });

    if (onProgress) onProgress(97);

    const rawText = result.data.text || '';
    const cleanText = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

    // 1. Text density check — catches photos of food, blank sheets, selfies etc.
    if (cleanText.trim().length < 15) {
      return {
        isValid: false,
        error: `No document text detected (only ${cleanText.trim().length} chars). Upload a clear photo of your Aadhaar card.`,
        detectedKeywords: [],
        confidence: 0
      };
    }

    // 2. UIDAI / Aadhaar landmark keywords
    const AADHAAR_LANDMARKS = [
      'government of india', 'govt of india', 'govt of', 'bharat sarkar',
      'unique identification', 'uidai', 'aadhaar', 'aadhar', 'adhar',
      'dob', 'date of birth', 'year of birth', 'yob',
      'male', 'female', 'transgender',
      'mera aadhaar', 'help uidai', 'vid', 'authority of india',
      'enrolment', 'enrollment', 'resident', 'resident of india'
    ];

    const matchedKeywords = AADHAAR_LANDMARKS.filter(kw => cleanText.includes(kw));

    // 3. Digit cross-match with the expected Aadhaar number
    let numberMatched = false;
    if (expectedAadhaar) {
      const cleanExpected = expectedAadhaar.replace(/\D/g, '');
      const digitsInOcr = rawText.replace(/\D/g, '');

      if (digitsInOcr.includes(cleanExpected)) {
        numberMatched = true;
      } else if (cleanExpected.length === 12) {
        // Match at least 2 of 3 four-digit blocks
        const blocks = [
          cleanExpected.slice(0, 4),
          cleanExpected.slice(4, 8),
          cleanExpected.slice(8, 12)
        ];
        const matched = blocks.filter(b => digitsInOcr.includes(b)).length;
        if (matched >= 2) numberMatched = true;
      }
    }

    // 4. Decision: need at least 2 UIDAI keywords OR 1 keyword + number match
    const hasAadhaarSignature =
      matchedKeywords.length >= 2 ||
      (matchedKeywords.length >= 1 && numberMatched);

    if (!hasAadhaarSignature) {
      return {
        isValid: false,
        error: `Aadhaar markings not found in image. Expected keywords like "Government of India", "UIDAI", or "DOB". Found: [${matchedKeywords.join(', ') || 'none'}]. Please upload a clear photo of your Aadhaar card.`,
        detectedKeywords: matchedKeywords,
        numberMatched,
        confidence: Math.round(result.data.confidence || 0)
      };
    }

    if (onProgress) onProgress(100);

    return {
      isValid: true,
      detectedKeywords: matchedKeywords,
      numberMatched,
      confidence: Math.round(result.data.confidence || 88),
      extractedSnippet: rawText.slice(0, 200)
    };

  } catch (err) {
    console.warn('Tesseract OCR error:', err);
    // Graceful fallback — allow submission but flag for manual review
    return {
      isValid: true,
      manualReviewRequired: true,
      detectedKeywords: ['OCR engine fallback'],
      confidence: 70,
      error: null
    };
  }
}
