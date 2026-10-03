const express = require('express');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// Knowledge Base policies for instant, zero-latency answers
const KNOWLEDGE_BASE = {
  damage_waiver: {
    title: "🛡️ Rentora Damage Waiver Policy",
    summary: "Accidental spills, minor fabric tears, surface scuffs, and electronic voltage surges are covered up to ₹10,000 at ₹0 deduction from your security deposit. For severe motor or structural defects, our technician arrives within 24 hours for free doorstep replacement.",
    action: { type: 'OPEN_MAINTENANCE', label: '🛠️ Book Free Inspection / Repair' }
  },
  relocation: {
    title: "🚚 Free Inter-City Shifting",
    summary: "Relocating to another city? Rentora provides 100% FREE doorstep packing, transit insurance, and installation across 8 metro cities (Hyderabad, Bangalore, Mumbai, Pune, Delhi-NCR, Chennai, Kolkata, Ahmedabad) after 6 months of active tenure.",
    action: { type: 'OPEN_RELOCATION', label: '🚚 Book Free Relocation Shifting' }
  },
  buyout: {
    title: "💎 Rent-to-Own Equity Buyout Engine",
    summary: "You can own your rented appliance anytime! 70% of every rupee you have paid in monthly rent is credited directly as equity toward the buyout value. Your original security deposit is also offset against the balance, and an official Certificate of Permanent Ownership & title deed is generated immediately.",
    action: { type: 'NAVIGATE_RENTALS', label: '💎 Open Buyout & Tenure Engine' }
  },
  tenure_extension: {
    title: "⚡ Tenure Extension & Long-Term Savings",
    summary: "Extend your rental plan anytime to unlock lower monthly rentals: Enjoy 10% OFF for 6-month extensions and 20% OFF for 12-month extensions. Plus, long-term subscribers receive complimentary annual deep cleaning.",
    action: { type: 'NAVIGATE_RENTALS', label: '⚡ View Tenure Extension Discounts' }
  },
  deposit_refund: {
    title: "💰 Security Deposit Refund Policy",
    summary: "Your refundable security deposit is held securely in escrow. Once your rental concludes and our QA team completes the doorstep pickup inspection, 100% of the deposit balance is credited back to your bank account or UPI within 5 to 7 business days.",
    action: { type: 'NAVIGATE_RENTALS', label: '📦 View Active Rentals & Deposit' }
  },
  delivery: {
    title: "📍 48-Hour Delivery & White-Glove Setup",
    summary: "All Rentora orders include free doorstep delivery, hydraulic elevator handling, plumbing connections, and electric demos within 24 to 48 hours. You can track your delivery vehicle in real-time and provide your secure 4-digit OTP to the technician.",
    action: { type: 'NAVIGATE_RENTALS', label: '📍 Track Active Delivery & OTP' }
  },
  pincode: {
    title: "🌍 Serviceable Cities & Delivery Pincodes",
    summary: "We currently deliver to over 4,500 pincodes across 8 major hubs: Bangalore, Mumbai, Hyderabad, Pune, Delhi-NCR, Chennai, Kolkata, and Ahmedabad. Same-day delivery slots are available in select metro zones.",
    action: { type: 'CHECK_PINCODE', label: '📍 Check My Pincode' }
  }
};

// POST /api/concierge/chat
router.post('/concierge/chat', async (req, res) => {
  try {
    const { message = '', context = {} } = req.body;
    const db = getDb();
    const cleanMsg = message.trim().toLowerCase();

    if (!cleanMsg) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    let reply = "";
    let recommendations = [];
    let action = null;
    let suggestedChips = [
      "💡 1 BHK Setup under ₹1,500",
      "🛡️ Damage Waiver Policy",
      "🚚 Free City Shifting",
      "💎 How Rent-to-Own Works",
      "📦 Track My Delivery"
    ];

    // 1. Check for Policy Inquiries
    if (cleanMsg.includes('damage') || cleanMsg.includes('scratch') || cleanMsg.includes('leak') || cleanMsg.includes('break') || cleanMsg.includes('spill') || cleanMsg.includes('waiver')) {
      reply = `${KNOWLEDGE_BASE.damage_waiver.title}\n\n${KNOWLEDGE_BASE.damage_waiver.summary}`;
      action = KNOWLEDGE_BASE.damage_waiver.action;
      suggestedChips = ["🛠️ Book Free Repair", "💰 Deposit Refund Rules", "💎 Buyout This Item"];
    } 
    else if (cleanMsg.includes('relocat') || cleanMsg.includes('shift') || cleanMsg.includes('move city') || cleanMsg.includes('moving') || cleanMsg.includes('bangalore') || cleanMsg.includes('hyderabad') || cleanMsg.includes('mumbai') || cleanMsg.includes('pune')) {
      reply = `${KNOWLEDGE_BASE.relocation.title}\n\n${KNOWLEDGE_BASE.relocation.summary}`;
      action = KNOWLEDGE_BASE.relocation.action;
      suggestedChips = ["🚚 Start Relocation Request", "🛡️ Damage Waiver Policy", "⚡ Extend Tenure (Save 20%)"];
    }
    else if (cleanMsg.includes('buyout') || cleanMsg.includes('buy out') || cleanMsg.includes('buy-out') || cleanMsg.includes('own') || cleanMsg.includes('purchase') || cleanMsg.includes('rent to own') || cleanMsg.includes('equity') || cleanMsg.includes('certificate')) {
      reply = `${KNOWLEDGE_BASE.buyout.title}\n\n${KNOWLEDGE_BASE.buyout.summary}`;
      action = KNOWLEDGE_BASE.buyout.action;
      suggestedChips = ["💎 Calculate My Equity", "⚡ Tenure Extension (Save 20%)", "📦 View Active Rentals"];
    }
    else if (cleanMsg.includes('extend') || cleanMsg.includes('tenure') || cleanMsg.includes('discount') || cleanMsg.includes('longer') || cleanMsg.includes('save')) {
      reply = `${KNOWLEDGE_BASE.tenure_extension.title}\n\n${KNOWLEDGE_BASE.tenure_extension.summary}`;
      action = KNOWLEDGE_BASE.tenure_extension.action;
      suggestedChips = ["⚡ Extend 6 Months (10% Off)", "⚡ Extend 12 Months (20% Off)", "💎 Permanent Buyout"];
    }
    else if (cleanMsg.includes('deposit') || cleanMsg.includes('refund') || cleanMsg.includes('return') || cleanMsg.includes('money back')) {
      reply = `${KNOWLEDGE_BASE.deposit_refund.title}\n\n${KNOWLEDGE_BASE.deposit_refund.summary}`;
      action = KNOWLEDGE_BASE.deposit_refund.action;
      suggestedChips = ["📦 View Active Orders", "🛡️ Damage Waiver Policy", "🚚 Free Shifting"];
    }
    else if (cleanMsg.includes('track') || cleanMsg.includes('delivery') || cleanMsg.includes('status') || cleanMsg.includes('install') || cleanMsg.includes('otp')) {
      reply = `${KNOWLEDGE_BASE.delivery.title}\n\n${KNOWLEDGE_BASE.delivery.summary}`;
      action = KNOWLEDGE_BASE.delivery.action;
      suggestedChips = ["📍 Track Live Van & OTP", "🛠️ Book Installation Help", "💡 Recommend Combos"];
    }
    else if (cleanMsg.includes('pincode') || cleanMsg.includes('area') || cleanMsg.includes('city') || cleanMsg.includes('serviceable')) {
      reply = `${KNOWLEDGE_BASE.pincode.title}\n\n${KNOWLEDGE_BASE.pincode.summary}`;
      action = KNOWLEDGE_BASE.pincode.action;
      suggestedChips = ["📍 Check Pincode", "💡 1 BHK Setup under ₹1,500", "🚚 Free Relocation"];
    }
    else if (cleanMsg.includes('cart') || cleanMsg.includes('checkout') || cleanMsg.includes('bag')) {
      reply = "Your shopping bag holds your chosen rental appliances with transparent security deposits and zero hidden delivery fees. Would you like to review your cart and proceed to KYC checkout?";
      action = { type: 'NAVIGATE_CART', label: '🛒 Review Shopping Cart' };
      suggestedChips = ["🛒 Go to Cart", "💡 Recommend Combos", "🛡️ Damage Waiver Policy"];
    }

    // 2. Product & Room Package Recommendations
    const wantsRecommendation = cleanMsg.includes('recommend') || cleanMsg.includes('suggest') || cleanMsg.includes('show') || cleanMsg.includes('combo') || cleanMsg.includes('bhk') || cleanMsg.includes('setup') || cleanMsg.includes('fridge') || cleanMsg.includes('sofa') || cleanMsg.includes('bed') || cleanMsg.includes('washing') || cleanMsg.includes('ac') || cleanMsg.includes('purifier') || cleanMsg.includes('under') || cleanMsg.includes('budget') || cleanMsg.includes('1500') || cleanMsg.includes('2000');

    if (wantsRecommendation || !reply) {
      // Extract budget if present (e.g. under 1500, 2000, etc.)
      const budgetMatch = cleanMsg.match(/(?:under|below|less than|within|budget)\s*(?:₹|rs\.?|inr)?\s*(\d{3,5})/i) || cleanMsg.match(/(\d{3,5})\s*(?:rs|inr|per month|\/mo)/i);
      const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;

      // Extract category keywords
      const query = { stock_quantity: { $gt: 0 } };
      if (maxBudget) {
        query.monthly_price = { $lte: maxBudget };
      }

      if (cleanMsg.includes('fridge') || cleanMsg.includes('refrigerator')) {
        query.rental_name = { $regex: 'refrigerator|fridge', $options: 'i' };
      } else if (cleanMsg.includes('washing')) {
        query.rental_name = { $regex: 'washing machine|washer', $options: 'i' };
      } else if (cleanMsg.includes('sofa') || cleanMsg.includes('couch')) {
        query.rental_name = { $regex: 'sofa', $options: 'i' };
      } else if (cleanMsg.includes('bed') || cleanMsg.includes('mattress')) {
        query.rental_name = { $regex: 'bed|mattress', $options: 'i' };
      } else if (cleanMsg.includes('ac') || cleanMsg.includes('air conditioner')) {
        query.rental_name = { $regex: 'air conditioner|ac', $options: 'i' };
      } else if (cleanMsg.includes('combo') || cleanMsg.includes('bhk') || cleanMsg.includes('package')) {
        query.$or = [
          { category_id: { $regex: 'package|combo|living|bedroom', $options: 'i' } },
          { rental_name: { $regex: 'package|combo|set', $options: 'i' } }
        ];
      }

      const matchingApps = await db.collection('appliances')
        .find(query)
        .sort({ monthly_price: 1 })
        .limit(4)
        .toArray();

      if (matchingApps.length > 0) {
        recommendations = matchingApps.map(app => ({
          appliance_id: app.appliance_id || String(app._id),
          rental_name: app.rental_name,
          monthly_price: app.monthly_price,
          security_deposit: app.security_deposit || 500,
          category_id: app.category_id,
          image_url: app.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
          rating: app.rating || 4.8
        }));

        if (!reply) {
          const budgetText = maxBudget ? ` under ₹${maxBudget.toLocaleString('en-IN')}/mo` : '';
          reply = `Here are ${matchingApps.length} hand-picked rental recommendations${budgetText} that offer maximum comfort, high energy ratings, and zero maintenance liability. You can add any item directly to your cart below! ⚡`;
          action = { type: 'VIEW_CATALOG', label: '🔍 Explore All Catalog Items' };
          suggestedChips = [
            "💡 1 BHK Living Combo",
            "🛡️ What happens if it breaks?",
            "🚚 Is relocation free?",
            "💎 Can I own this later?"
          ];
        }
      } else if (!reply) {
        reply = "I'm your Rentora Intelligent Assistant! You can ask me anything about rental plans, our ₹10,000 Damage Waiver, free inter-city shifting, or ask me to recommend a tailored appliance setup for your budget.";
        suggestedChips = [
          "💡 1 BHK Setup under ₹1,500",
          "🛡️ Damage Waiver Policy",
          "🚚 Free Relocation Rules",
          "💎 Rent-to-Own Equity Buyout"
        ];
      }
    }

    return res.status(200).json({
      reply,
      recommendations,
      action,
      suggestedChips,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Concierge chat error:', err);
    return res.status(500).json({
      error: 'Concierge processing error',
      reply: "I'm having a brief connection hitch, but our standard policies include free inter-city shifting after 6 months and a ₹10,000 damage waiver on all active rentals!",
      suggestedChips: ["🛡️ Damage Waiver Policy", "🚚 Free City Relocation", "💎 How Rent-to-Own Works"]
    });
  }
});

module.exports = router;
