const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { optionalAuth } = require('../auth');

const router = express.Router();

// Cross-Category Room Pairing Association Matrix
const COMPLEMENTARY_PAIRS = {
  'refrigerators': ['Microwaves', 'Water Purifiers', 'Induction Cooktops', 'Dining Tables'],
  'washing machines': ['Water Purifiers', 'Cloth Dryers', 'Microwaves', 'Air Conditioners'],
  'air conditioners': ['Air Purifiers', 'Beds', 'Wardrobes', 'Study Desks'],
  'microwaves': ['Refrigerators', 'Water Purifiers', 'Induction Cooktops', 'Dining Tables'],
  'water purifiers': ['Refrigerators', 'Microwaves', 'Induction Cooktops'],
  'televisions': ['Sofas', 'Coffee Tables', 'Living Room', 'TV Units', 'Recliners'],
  'sofas': ['Coffee Tables', 'Televisions', 'Living Room', 'Study Desks', 'Recliners'],
  'beds': ['Wardrobes', 'Bedside Tables', 'Mattresses', 'Air Conditioners', 'Dressing Tables'],
  'wardrobes': ['Beds', 'Bedside Tables', 'Dressing Tables', 'Air Conditioners'],
  'study desks': ['Ergonomic Chairs', 'Bookshelves', 'Air Conditioners', 'Living Room'],
  'dining tables': ['Refrigerators', 'Microwaves', 'Water Purifiers', 'Living Room'],
  'appliances': ['Furniture', 'Water Purifiers', 'Microwaves'],
  'furniture': ['Appliances', 'Televisions', 'Lighting']
};

function normalizeCategory(str) {
  if (!str) return '';
  return str.toLowerCase().trim();
}

function findComplementaryCategories(subCategory, categoryId) {
  const normSub = normalizeCategory(subCategory);
  const normCat = normalizeCategory(categoryId);

  let matches = [];
  for (const [key, targets] of Object.entries(COMPLEMENTARY_PAIRS)) {
    if (normSub.includes(key) || normCat.includes(key) || key.includes(normSub)) {
      matches.push(...targets);
    }
  }
  return [...new Set(matches)];
}

// GET /api/recommendations/
// Supports query parameters:
// - city: e.g. "Bangalore", "Hyderabad", "Mumbai"
// - filter: 'for_you' | 'room_bundles' | 'trending'
// - appliance_id: optional target item to find complementary accessories for
router.get('/recommendations/', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user ? req.user.id : null;
    const requestedCity = req.query.city || 'Bangalore';
    const filter = req.query.filter || 'for_you';
    const targetApplianceId = req.query.appliance_id || null;

    // 1. Gather context: User Cart, User Active Rentals, and Target Appliance
    let userCartItems = [];
    let userActiveRentals = [];
    let targetAppliance = null;

    if (userId) {
      userCartItems = await db.collection('cart').find({ user_id: userId }).toArray();
      userActiveRentals = await db.collection('rentals').find({ user_id: userId }).toArray();
    }

    if (targetApplianceId) {
      targetAppliance = await db.collection('appliances').findOne({
        $or: [{ _id: targetApplianceId }, { appliance_id: targetApplianceId }]
      });
    }

    // Identify user's interacted categories and existing appliance IDs
    const existingApplianceIds = new Set();
    const interactedSubCategories = [];
    let totalRentSum = 0;
    let rentCount = 0;

    for (const c of userCartItems) {
      existingApplianceIds.add(String(c.appliance_id || c._id));
      if (c.appliance) {
        interactedSubCategories.push({
          name: c.appliance.rental_name,
          category: c.appliance.category_id,
          subCategory: c.appliance.sub_category
        });
        const p = parseFloat(c.appliance.monthly_price) || 0;
        if (p > 0) { totalRentSum += p; rentCount++; }
      }
    }

    for (const r of userActiveRentals) {
      existingApplianceIds.add(String(r.appliance_id || r._id));
      if (r.appliance) {
        interactedSubCategories.push({
          name: r.appliance.rental_name,
          category: r.appliance.category_id,
          subCategory: r.appliance.sub_category
        });
        const p = parseFloat(r.monthly_rent || r.appliance.monthly_price) || 0;
        if (p > 0) { totalRentSum += p; rentCount++; }
      }
    }

    if (targetAppliance) {
      interactedSubCategories.push({
        name: targetAppliance.rental_name,
        category: targetAppliance.category_id,
        subCategory: targetAppliance.sub_category
      });
    }

    const avgBudget = rentCount > 0 ? (totalRentSum / rentCount) : 1200;

    // 2. Fetch all active catalog items with available stock
    const catalog = await db.collection('appliances')
      .find({ stock_quantity: { $gt: 0 } })
      .toArray();

    if (!catalog || catalog.length === 0) {
      return res.status(200).json([]);
    }

    // 3. Compute Real-Time Hybrid Scoring for every candidate
    const scoredList = catalog.map((item) => {
      const itemIdStr = String(item._id);
      const isAlreadyInCartOrRental = existingApplianceIds.has(itemIdStr) || existingApplianceIds.has(String(item.appliance_id));

      const itemPrice = parseFloat(item.monthly_price) || 800;
      const itemCityStr = String(item.available_cities || '').toLowerCase();
      const cityMatches = requestedCity ? itemCityStr.includes(requestedCity.toLowerCase()) : true;

      let affinityScore = 0.20;
      let reason = `Top trending selection in ${requestedCity} with 5-star reliability rating`;
      let recType = 'CITY_TRENDING';
      let bundleBadge = 'Smart Add-on';
      let pairedWithItemName = null;

      // Check Complementary Matrix against user's cart/rentals
      if (interactedSubCategories.length > 0) {
        for (const interacted of interactedSubCategories) {
          const complementaries = findComplementaryCategories(interacted.subCategory, interacted.category);
          const itemCatNorm = normalizeCategory(item.category_id);
          const itemSubNorm = normalizeCategory(item.sub_category);
          const itemNameNorm = normalizeCategory(item.rental_name);

          const isComplementary = complementaries.some(comp => {
            const compNorm = normalizeCategory(comp);
            return itemCatNorm.includes(compNorm) || itemSubNorm.includes(compNorm) || itemNameNorm.includes(compNorm);
          });

          if (isComplementary) {
            affinityScore = Math.max(affinityScore, 0.85);
            pairedWithItemName = interacted.name;
            reason = `Frequently rented together with your ${interacted.name} (15% Combo Savings)`;
            recType = 'ROOM_BUNDLE';
            bundleBadge = 'Room Combo';
            break;
          }
        }

        // If not complementary, check same category upgrade/variety
        if (affinityScore < 0.5) {
          const sharesCategory = interactedSubCategories.some(i => 
            normalizeCategory(i.category) === normalizeCategory(item.category_id)
          );
          if (sharesCategory) {
            affinityScore = 0.45;
            reason = `Matches your preference for premium ${item.category_id || 'appliances'}`;
            recType = 'SIMILAR_STYLE';
            bundleBadge = 'Style Match';
          }
        }
      }

      // Geo-popularity boost
      let geoScore = cityMatches ? 0.30 : 0.05;

      // Rating & stock popularity boost
      const rating = parseFloat(item.rating) || 4.6;
      let popularityScore = Math.min(0.25, (rating / 5.0) * 0.25);

      // Budget fit score
      let budgetScore = 0.10;
      const budgetDiffPct = Math.abs(itemPrice - avgBudget) / avgBudget;
      if (budgetDiffPct <= 0.35) {
        budgetScore = 0.20;
      }

      // Filter bias:
      let filterMultiplier = 1.0;
      if (filter === 'room_bundles') {
        if (recType === 'ROOM_BUNDLE') filterMultiplier = 1.6;
        else filterMultiplier = 0.6;
      } else if (filter === 'trending') {
        if (cityMatches) filterMultiplier = 1.4;
      }

      // Calculate composite score (0 to 1)
      let composite = (affinityScore * 0.40 + geoScore * 0.30 + popularityScore * 0.20 + budgetScore * 0.10) * filterMultiplier;

      // Penalize items already in cart or rental so user sees new discovery items
      if (isAlreadyInCartOrRental) {
        composite *= 0.15;
      }

      // Scale to human match percentage (82% to 98%)
      const matchPercentage = Math.min(98, Math.max(82, Math.round(78 + (composite * 20))));

      return {
        item,
        composite,
        matchPercentage,
        reason,
        recType,
        bundleBadge,
        isAlreadyInCartOrRental
      };
    });

    // 4. Sort by composite score descending
    scoredList.sort((a, b) => b.composite - a.composite);

    // 5. Take top 8 distinct recommendations
    const topScored = scoredList.slice(0, 8);

    // Format response matching both legacy & enhanced schema
    const result = topScored.map((entry, idx) => {
      const app = { ...entry.item, _id: String(entry.item._id) };
      return {
        recommendation_id: `REC-${String(app._id).slice(-6)}-${idx}`,
        recommended_appliance_id: app._id,
        recommended_appliance_details: app,
        similarity_score: (entry.matchPercentage / 100),
        match_percentage: entry.matchPercentage,
        recommendation_reason: entry.reason,
        recommendation_type: entry.recType,
        bundle_badge: entry.bundleBadge,
        combo_discount_pct: entry.recType === 'ROOM_BUNDLE' ? 15 : 10,
        city: requestedCity,
        last_updated: new Date()
      };
    });

    // Synchronize to MongoDB appliance_recommendations if user is logged in
    if (userId && result.length > 0) {
      try {
        const mongoDocs = result.map(r => ({
          _id: crypto.randomUUID(),
          user_id: userId,
          recommended_appliance_id: r.recommended_appliance_details._id,
          match_percentage: r.match_percentage,
          recommendation_reason: r.recommendation_reason,
          recommendation_type: r.recommendation_type,
          last_updated: new Date()
        }));
        await db.collection('appliance_recommendations').deleteMany({ user_id: userId });
        await db.collection('appliance_recommendations').insertMany(mongoDocs);
      } catch (saveErr) {
        // Non-blocking background sync error
        console.warn('Sync to appliance_recommendations skipped:', saveErr.message);
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Fetch recommendations error:', err);
    return res.status(500).json({ error: 'Internal server error fetching recommendations' });
  }
});

module.exports = router;
