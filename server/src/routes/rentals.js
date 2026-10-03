const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');

const router = express.Router();

// GET /api/rentals/
router.get('/rentals/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const statusFilter = req.query.status || 'active';

    const query = { user_id: userId };
    if (statusFilter === 'active') {
      query.status = { $in: ['active', 'OWNED'] };
    } else if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const rentals = await db.collection('rentals').find(query).sort({ rented_at: -1 }).toArray();
    const result = [];

    for (const r of rentals) {
      const app = await db.collection('appliances').findOne({ appliance_id: r.appliance_id });
      let applianceData;
      if (app) {
        app._id = String(app._id);
        applianceData = app;
      } else {
        const fallbackRent = r.monthly_rent || r.amount_paid || 500;
        applianceData = {
          appliance_id: r.appliance_id,
          rental_name: r.rental_name || 'Premium Home Appliance',
          category_id: r.category_id || 'Appliances',
          sub_category: 'Home & Living',
          brand: 'Rentora Select',
          monthly_price: fallbackRent,
          image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
          pricing: {
            '3': fallbackRent,
            '6': Math.round(fallbackRent * 0.9),
            '12': Math.round(fallbackRent * 0.8)
          },
          security_deposit: r.security_deposit || Math.round(fallbackRent * 1.5)
        };
      }

      result.push({
        rental_id: String(r._id),
        appliance: applianceData,
        tenure: r.tenure || '3',
        status: r.status || 'active',
        monthly_rent: r.monthly_rent || applianceData.monthly_price || 500,
        security_deposit: r.security_deposit || 0.0,
        deposit_status: r.deposit_status || 'HELD',
        deposit_refunded: r.deposit_refunded || 0.0,
        refund_transaction_id: r.refund_transaction_id || null,
        refund_date: r.refund_date || null,
        transaction_id: r.transaction_id || null,
        invoice_number: r.invoice_number || null,
        payment_method: r.payment_method || 'UPI_GATEWAY',
        rented_at: r.rented_at,
        returned_at: r.returned_at,
        next_billing_date: r.next_billing_date,
        buyout_details: r.buyout_details || null,
        certificate_id: r.certificate_id || null,
        ownership_transfer_date: r.ownership_transfer_date || null,
        tenure_extension_history: r.tenure_extension_history || null,
        delivery_address: r.delivery_address || null,
        delivery_status: r.delivery_status || (r.status === 'active' ? 'DELIVERED' : 'QUALITY_CHECK'),
        delivery_tracking: r.delivery_tracking || {
          tracking_id: 'TRK-' + String(r._id).slice(0, 6).toUpperCase(),
          courier_partner: 'Rentora Direct Fleet & White-Glove Installation',
          agent_name: 'Rajesh Patil (Senior Field Engineer)',
          agent_phone: '+91 98450 12891',
          vehicle_number: 'KA-01-EL-9284',
          delivery_otp: '4829',
          current_stage: r.status === 'active' ? 'DELIVERED' : 'QUALITY_CHECK',
          slot: r.delivery_address?.delivery_slot || 'Express (Within 24-48 Hours)',
          estimated_delivery: 'Scheduled Window',
          timeline: [
            {
              stage: 'ORDER_CONFIRMED',
              title: 'Order Confirmed & Lease Contract Signed',
              description: 'Digital rental agreement verified and security deposit held in RBI-compliant escrow.',
              timestamp: r.rented_at,
              completed: true
            },
            {
              stage: 'KYC_VERIFIED',
              title: 'KYC Identity & Residence Approved',
              description: 'Customer profile cleared by compliance team for doorstep fulfillment.',
              timestamp: r.rented_at,
              completed: true
            },
            {
              stage: 'QUALITY_CHECK',
              title: '28-Point Sanitization & Inspection',
              description: 'Appliance sanitized and verified through multi-point technical check.',
              timestamp: r.rented_at,
              completed: true
            },
            {
              stage: 'OUT_FOR_DELIVERY',
              title: 'Out for Doorstep Delivery & Free Installation',
              description: 'Technician is en route with your appliance and dedicated toolset.',
              timestamp: r.status === 'active' ? r.rented_at : null,
              completed: r.status === 'active'
            },
            {
              stage: 'DELIVERED',
              title: 'Delivered, Demoed & Handover Complete',
              description: 'Appliance placed, leveled, fully tested with operational demo, and delivery OTP confirmed.',
              timestamp: r.status === 'active' ? r.rented_at : null,
              completed: r.status === 'active'
            }
          ]
        }
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Fetch rentals error:', err);
    return res.status(500).json({ error: 'Internal server error fetching rentals' });
  }
});

// PATCH /api/rentals/ (Swap or Return with damage & fine calculation)
router.patch('/rentals/', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { rental_id, action } = req.body;

    if (!rental_id) {
      return res.status(400).json({ error: 'rental_id is required' });
    }

    const rental = await db.collection('rentals').findOne({ _id: rental_id, user_id: userId, status: 'active' });
    if (!rental) {
      return res.status(404).json({ error: 'Active rental not found' });
    }

    const now = new Date();

    // Action 1: Swap
    if (action === 'swap') {
      const { new_appliance_id } = req.body;
      if (!new_appliance_id) {
        return res.status(400).json({ error: 'new_appliance_id is required for swap' });
      }

      const newApp = await db.collection('appliances').findOne({ appliance_id: new_appliance_id });
      if (!newApp) {
        return res.status(404).json({ error: 'Replacement appliance not found' });
      }

      const swapTicket = `SWAP_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      await db.collection('rentals').updateOne(
        { _id: rental_id },
        {
          $set: {
            appliance_id: new_appliance_id,
            monthly_rent: newApp.monthly_price || rental.monthly_rent,
            last_swapped_at: now,
            swap_ticket_id: swapTicket
          }
        }
      );

      await db.collection('appliances').updateOne(
        { appliance_id: rental.appliance_id },
        { $inc: { stock_quantity: 1 } }
      );
      await db.collection('appliances').updateOne(
        { appliance_id: new_appliance_id },
        { $inc: { stock_quantity: -1 } }
      );

      return res.status(200).json({
        success: 'Experience Swap scheduled successfully',
        swap_ticket_id: swapTicket,
        replacement_name: newApp.rental_name
      });
    }

    // Action 2: Rent-to-Own Buyout (Amortization & Ownership Transfer)
    if (action === 'buyout') {
      const app = await db.collection('appliances').findOne({ appliance_id: rental.appliance_id });
      const monthlyRent = parseFloat(rental.monthly_rent || (app ? app.monthly_price : 500));
      const mrp = parseFloat(app?.original_price || app?.purchase_price || (monthlyRent * 14));
      
      const rentedAt = rental.rented_at ? new Date(rental.rented_at) : new Date();
      const diffMs = Math.max(0, now - rentedAt);
      const monthsRented = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
      
      const accumulatedRent = Math.round(monthlyRent * monthsRented);
      const equityCredit = Math.round(accumulatedRent * 0.70);
      const heldDeposit = parseFloat(rental.security_deposit || 0);
      
      const residualBase = Math.max(500, Math.round(mrp - equityCredit - heldDeposit));
      const gstAmount = Math.round(residualBase * 0.18);
      const finalBuyoutTotal = Math.round(residualBase + gstAmount);
      
      const certId = `CERT_OWN_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const buyoutTxnId = `BUYOUT_${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      const invoiceNumber = `INV-OWN-${Date.now().toString().slice(-6)}`;
      
      const buyoutDetails = {
        mrp,
        months_rented: monthsRented,
        monthly_rent: monthlyRent,
        accumulated_rent_paid: accumulatedRent,
        equity_credit: equityCredit,
        security_deposit_applied: heldDeposit,
        residual_base: residualBase,
        gst_amount: gstAmount,
        total_paid_for_buyout: finalBuyoutTotal,
        payment_method: req.body.payment_method || 'UPI / NetBanking (Instant Settlement)',
        ownership_certificate_id: certId,
        buyout_transaction_id: buyoutTxnId,
        invoice_number: invoiceNumber,
        completed_at: now,
        warranty_status: '1-Year Rentora Care Warranty Transferred',
        customer_name: req.user.username || req.user.email || 'Valued Tenant'
      };

      await db.collection('rentals').updateOne(
        { _id: rental_id },
        {
          $set: {
            status: 'OWNED',
            ownership_transfer_date: now,
            certificate_id: certId,
            deposit_status: 'APPLIED_TO_BUYOUT',
            next_billing_date: null,
            buyout_details: buyoutDetails
          }
        }
      );

      // Record buyout invoice into payments collection
      await db.collection('payments').insertOne({
        _id: crypto.randomUUID(),
        transaction_id: buyoutTxnId,
        invoice_number: invoiceNumber,
        user_id: userId,
        user_email: req.user.email || '',
        user_name: req.user.username || 'Valued Tenant',
        amount_rent: residualBase,
        amount_deposit: 0,
        amount_tax: gstAmount,
        amount_total: finalBuyoutTotal,
        payment_method: req.body.payment_method || 'UPI_GATEWAY',
        payment_details: { type: 'RENT_TO_OWN_BUYOUT', certificate_id: certId },
        delivery_address: rental.delivery_address || null,
        status: 'SUCCESS',
        payment_gateway: 'Rentora Equity Buyout Clearance',
        created_at: now,
        rental_ids: [rental_id],
        items_summary: [{
          rental_id,
          appliance_id: rental.appliance_id,
          rental_name: (app ? app.rental_name : rental.rental_name || 'Appliance') + ' [100% Title Transferred]',
          category_id: app?.category_id || 'Appliances',
          monthly_price: monthlyRent,
          buyout_price: finalBuyoutTotal,
          certificate_id: certId
        }]
      });

      return res.status(200).json({
        success: 'Rent-to-Own Buyout Completed! Permanent ownership title transferred.',
        certificate_id: certId,
        buyout_details: buyoutDetails
      });
    }

    // Action 3: Tenure Extension (Upgrade lease tenure to 6 or 12 months & discount monthly rent)
    if (action === 'extend_tenure') {
      const { new_tenure } = req.body;
      if (!new_tenure || !['6', '12'].includes(String(new_tenure))) {
        return res.status(400).json({ error: 'Valid new_tenure (6 or 12) is required' });
      }

      const app = await db.collection('appliances').findOne({ appliance_id: rental.appliance_id });
      const baseMonthly = app?.pricing?.['3'] || app?.monthly_price || rental.monthly_rent || 500;
      
      let newRent = baseMonthly;
      if (app?.pricing && app.pricing[String(new_tenure)]) {
        newRent = app.pricing[String(new_tenure)];
      } else {
        newRent = String(new_tenure) === '12' 
          ? Math.round(baseMonthly * 0.80) 
          : Math.round(baseMonthly * 0.90);
      }

      const prevTenure = rental.tenure || '3';
      const prevRent = rental.monthly_rent || baseMonthly;
      const monthlySavings = Math.max(0, prevRent - newRent);

      const historyEntry = {
        extended_at: now,
        previous_tenure: prevTenure,
        new_tenure: String(new_tenure),
        previous_rent: prevRent,
        new_rent: newRent,
        monthly_savings: monthlySavings
      };

      await db.collection('rentals').updateOne(
        { _id: rental_id },
        {
          $set: {
            tenure: String(new_tenure),
            monthly_rent: newRent,
            last_tenure_extended_at: now
          },
          $push: {
            tenure_extension_history: historyEntry
          }
        }
      );

      return res.status(200).json({
        success: `Tenure extended to ${new_tenure} months! Monthly subscription reduced to ₹${newRent}/mo.`,
        new_tenure: String(new_tenure),
        new_rent: newRent,
        monthly_savings: monthlySavings
      });
    }

    // Action 4: Module 6 Return Management (Return Request, Damage Report & Fine Calculation)
    const damageLevel = req.body.damage_level || 'NONE'; // NONE | MINOR | MODERATE | SEVERE
    const damageDescription = req.body.damage_description || '';
    const lateDays = parseInt(req.body.late_days || 0, 10);
    const depositAmount = parseFloat(rental.security_deposit || 0.0);

    let damageFine = 0.0;
    let waiverApplied = false;

    if (damageLevel === 'MINOR' || damageLevel === 'MODERATE') {
      waiverApplied = true;
      damageFine = 0.0;
    } else if (damageLevel === 'SEVERE') {
      const assessedCost = parseFloat(req.body.assessed_damage_cost || 1000.0);
      damageFine = Math.min(depositAmount, assessedCost);
    }

    const lateFine = lateDays * 50.0; // Rs. 50/day late penalty
    const totalFine = damageFine + lateFine;
    const depositRefunded = Math.max(0.0, Math.round((depositAmount - totalFine) * 100) / 100);

    const refundTxn = `REF_${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    const returnDocUpdate = {
      status: 'inactive',
      returned_at: now,
      deposit_status: depositRefunded > 0 ? 'REFUNDED' : 'FORFEITED_TO_FINES',
      deposit_refunded: depositRefunded,
      total_deposit_held: depositAmount,
      total_fines_deducted: totalFine,
      refund_transaction_id: refundTxn,
      refund_date: now,
      damage_report: {
        level: damageLevel,
        description: damageDescription,
        waiver_applied: waiverApplied,
        damage_fine: damageFine
      },
      fine_calculation: {
        late_days: lateDays,
        late_fine: lateFine,
        damage_fine: damageFine,
        total_fine: totalFine
      }
    };

    await db.collection('rentals').updateOne({ _id: rental_id }, { $set: returnDocUpdate });

    await db.collection('appliances').updateOne(
      { appliance_id: rental.appliance_id },
      { $inc: { stock_quantity: 1 } }
    );

    await db.collection('refunds').insertOne({
      _id: crypto.randomUUID(),
      refund_transaction_id: refundTxn,
      rental_id,
      user_id: userId,
      appliance_id: rental.appliance_id,
      initial_deposit: depositAmount,
      total_fines: totalFine,
      damage_fine: damageFine,
      late_fine: lateFine,
      waiver_applied: waiverApplied,
      refund_amount: depositRefunded,
      status: 'PROCESSED',
      credited_to: 'Original Payment Method',
      created_at: now
    });

    return res.status(200).json({
      success: 'Rental returned successfully',
      deposit_refunded: depositRefunded,
      total_deposit_held: depositAmount,
      damage_fine: damageFine,
      late_fine: lateFine,
      total_fines: totalFine,
      waiver_applied: waiverApplied,
      refund_transaction_id: refundTxn
    });
  } catch (err) {
    console.error('Rentals patch error:', err);
    return res.status(500).json({ error: 'Internal server error processing rental update' });
  }
});

// PATCH /api/rentals/:rental_id/reschedule - Reschedule delivery time window
router.patch('/rentals/:rental_id/reschedule', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const rentalId = req.params.rental_id;
    const { new_slot, new_date, reason } = req.body;

    if (!new_slot) {
      return res.status(400).json({ error: 'new_slot is required' });
    }

    const rental = await db.collection('rentals').findOne({ _id: rentalId, user_id: userId });
    if (!rental) {
      return res.status(404).json({ error: 'Rental subscription not found' });
    }

    const tracking = rental.delivery_tracking || {};
    const updatedTimeline = tracking.timeline ? [...tracking.timeline] : [];
    updatedTimeline.push({
      stage: 'RESCHEDULED',
      title: `Delivery Rescheduled to ${new_slot}`,
      description: `Delivery appointment updated.${new_date ? ' Scheduled Date: ' + new_date : ''}${reason ? ' Note: ' + reason : ''}`,
      timestamp: new Date().toISOString(),
      completed: true
    });

    const updateFields = {
      'delivery_address.delivery_slot': new_slot,
      'delivery_tracking.slot': new_slot,
      'delivery_tracking.rescheduled_count': (tracking.rescheduled_count || 0) + 1,
      'delivery_tracking.timeline': updatedTimeline
    };
    if (new_date) {
      updateFields['delivery_tracking.estimated_delivery'] = new_date;
    }

    await db.collection('rentals').updateOne(
      { _id: rentalId },
      { $set: updateFields }
    );

    return res.status(200).json({
      success: true,
      message: `Delivery successfully rescheduled to ${new_slot}!`,
      new_slot,
      new_date
    });
  } catch (err) {
    console.error('Reschedule delivery error:', err);
    return res.status(500).json({ error: 'Failed to reschedule delivery' });
  }
});

module.exports = router;
