const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// GET /api/admin/dashboard/
router.get('/admin/dashboard/', async (req, res) => {
  try {
    const db = getDb();

    // Total revenue from rentals
    const allRentals = await db.collection('rentals').find({}).toArray();
    const totalRevenue = allRentals.reduce((sum, r) => sum + (parseFloat(r.amount_paid) || 0), 0);
    const activeRentals = await db.collection('rentals').countDocuments({ status: 'active' });

    // Churn risk from ML collection user_churn_scores
    const atRiskScores = await db.collection('user_churn_scores')
      .find({ churn_risk_score: { $gt: 0.5 } })
      .sort({ churn_risk_score: -1 })
      .toArray();

    const atRiskData = atRiskScores.map(score => ({
      username: score.username || 'Unknown',
      email: score.email || '',
      churn_risk_score: parseFloat(score.churn_risk_score || 0),
      shap_reason: score.shap_reason || 'Risk factors detected',
      last_updated: score.last_updated
    }));

    // Store sales analytics
    const salesDoc = await db.collection('sales_analytics').findOne({ doc_type: 'store_sales_kpi' });
    let salesAnalytics = {};
    if (salesDoc) {
      salesAnalytics = {
        dataset_name: salesDoc.dataset_name || 'store_sales_data.csv',
        appliance_furniture_records: salesDoc.appliance_furniture_records || 0,
        total_sales_volume: salesDoc.total_sales_volume || 0,
        total_profit_volume: salesDoc.total_profit_volume || 0,
        avg_order_value: salesDoc.avg_order_value || 0,
        avg_discount_pct: salesDoc.avg_discount_pct || 0,
        categories: salesDoc.categories || [],
        top_states: salesDoc.top_states || [],
        city_tiers: salesDoc.city_tiers || [],
        customer_segments: salesDoc.customer_segments || [],
        recent_transactions: salesDoc.recent_transactions || [],
        last_updated: salesDoc.last_updated
      };
    }

    return res.status(200).json({
      total_revenue: totalRevenue,
      active_rentals: activeRentals,
      at_risk_customers: atRiskData,
      sales_analytics: salesAnalytics
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error fetching dashboard' });
  }
});

// GET /api/admin/users/
router.get('/admin/users/', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    const formatted = [];
    for (const u of users) {
      const activeRentalsCount = await db.collection('rentals').countDocuments({ user_id: u._id, status: 'active' });
      const totalRentalsCount = await db.collection('rentals').countDocuments({ user_id: u._id });

      formatted.push({
        ...u,
        _id: String(u._id),
        created_at: u.created_at instanceof Date ? u.created_at.toISOString() : u.created_at,
        active_rentals_count: activeRentalsCount,
        total_rentals_count: totalRentalsCount
      });
    }

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: 'Internal server error fetching users' });
  }
});

// PATCH /api/admin/users/ or /api/admin/users/:user_id/
router.patch(['/admin/users/', '/admin/users/:user_id/'], async (req, res) => {
  try {
    const db = getDb();
    const targetId = req.params.user_id || req.body.user_id;

    if (!targetId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const updates = {};
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.phone_num !== undefined) updates.phone_num = req.body.phone_num;
    if (req.body.is_active !== undefined) updates.is_active = Boolean(req.body.is_active);

    await db.collection('users').updateOne({ _id: targetId }, { $set: updates });
    return res.status(200).json({ success: 'User updated successfully' });
  } catch (err) {
    console.error('Admin update user error:', err);
    return res.status(500).json({ error: 'Internal server error updating user' });
  }
});

// DELETE /api/admin/users/ or /api/admin/users/:user_id/
router.delete(['/admin/users/', '/admin/users/:user_id/'], async (req, res) => {
  try {
    const db = getDb();
    const targetId = req.params.user_id || req.body.user_id;

    if (!targetId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    await db.collection('users').deleteOne({ _id: targetId });
    return res.status(200).json({ success: 'User deleted successfully' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Internal server error deleting user' });
  }
});

// GET /api/admin/rentals/
router.get('/admin/rentals/', async (req, res) => {
  try {
    const db = getDb();
    const statusFilter = req.query.status || 'all';

    const query = {};
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const rentals = await db.collection('rentals').find(query).sort({ rented_at: -1 }).toArray();
    const formatted = [];

    for (const r of rentals) {
      const user = await db.collection('users').findOne({ _id: r.user_id }, { projection: { password: 0 } });
      const app = await db.collection('appliances').findOne({ appliance_id: r.appliance_id });

      formatted.push({
        ...r,
        _id: String(r._id),
        customer_name: user ? user.username || 'Customer' : 'Customer',
        customer_email: user ? user.email || '' : '',
        customer_phone: user ? user.phone_num || '' : '',
        appliance_name: app ? app.rental_name || 'Appliance' : 'Appliance',
        appliance_image: app ? app.image_url || '' : '',
        appliance_category: app ? app.category_id || '' : '',
        rented_at: r.rented_at instanceof Date ? r.rented_at.toISOString() : r.rented_at,
        returned_at: r.returned_at instanceof Date ? r.returned_at.toISOString() : r.returned_at,
        next_billing_date: r.next_billing_date instanceof Date ? r.next_billing_date.toISOString() : r.next_billing_date
      });
    }

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Admin fetch rentals error:', err);
    return res.status(500).json({ error: 'Internal server error fetching rentals' });
  }
});

// PATCH /api/admin/rentals/:rental_id/approve/ or /api/admin/rentals/
router.patch(['/admin/rentals/:rental_id/approve/', '/admin/rentals/:rental_id/', '/admin/rentals/'], async (req, res) => {
  try {
    const db = getDb();
    const rentalId = req.params.rental_id || req.body.rental_id;

    if (!rentalId) {
      return res.status(400).json({ error: 'rental_id is required' });
    }

    const { status, delivery_stage, agent_name, agent_phone, vehicle_number, entered_otp, admin_notes } = req.body;
    const newStatus = status || (delivery_stage === 'DELIVERED' ? 'delivered' : (delivery_stage === 'OUT_FOR_DELIVERY' ? 'dispatched' : undefined));

    const existing = await db.collection('rentals').findOne({ _id: rentalId });
    if (!existing) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const currentTracking = existing.delivery_tracking || {};
    const timeline = currentTracking.timeline ? [...currentTracking.timeline] : [];

    const setObj = {
      admin_reviewed_at: new Date(),
      admin_notes: admin_notes || 'Updated by Admin Logistics'
    };

    if (newStatus) setObj.status = newStatus;

    if (delivery_stage) {
      setObj.delivery_status = delivery_stage;
      setObj['delivery_tracking.current_stage'] = delivery_stage;

      // Update matching timeline stage
      for (const t of timeline) {
        if (t.stage === delivery_stage) {
          t.completed = true;
          t.timestamp = new Date().toISOString();
        }
      }
      setObj['delivery_tracking.timeline'] = timeline;
    }

    if (agent_name) setObj['delivery_tracking.agent_name'] = agent_name;
    if (agent_phone) setObj['delivery_tracking.agent_phone'] = agent_phone;
    if (vehicle_number) setObj['delivery_tracking.vehicle_number'] = vehicle_number;

    if (entered_otp) {
      const correctOtp = currentTracking.delivery_otp;
      if (correctOtp && String(entered_otp).trim() !== String(correctOtp).trim()) {
        return res.status(400).json({ error: `Invalid Handover OTP. Customer's OTP did not match.` });
      }
      setObj['delivery_tracking.otp_verified'] = true;
      setObj['delivery_tracking.handover_timestamp'] = new Date().toISOString();
    }

    await db.collection('rentals').updateOne(
      { _id: rentalId },
      { $set: setObj }
    );

    try {
      const { notifyUser, notifyAdmin } = require('../socket');
      const updatedRental = await db.collection('rentals').findOne({ _id: rentalId });
      if (updatedRental) {
        notifyUser(updatedRental.user_id, 'delivery:updated', {
          rental_id: rentalId,
          delivery_status: setObj.delivery_status || existing.delivery_status,
          delivery_tracking: updatedRental.delivery_tracking,
          message: `Your appliance delivery status has been updated to: ${setObj.delivery_status || existing.delivery_status}`
        });
        notifyAdmin('admin:dispatch_updated', {
          rental_id: rentalId,
          delivery_status: setObj.delivery_status || existing.delivery_status
        });
      }
    } catch (e) {
      console.warn('Socket dispatch notification error:', e.message);
    }

    return res.status(200).json({
      success: `Rental dispatch details updated successfully`,
      delivery_stage: delivery_stage || existing.delivery_status,
      status: setObj.status || existing.status
    });
  } catch (err) {
    console.error('Admin update rental error:', err);
    return res.status(500).json({ error: 'Internal server error updating rental' });
  }
});

// GET /api/admin/kyc/
router.get('/admin/kyc/', async (req, res) => {
  try {
    const db = getDb();
    const kycDocs = await db.collection('kyc')
      .find({})
      .sort({ submitted_at: -1 })
      .toArray();

    const formatted = [];
    for (const doc of kycDocs) {
      const user = await db.collection('users').findOne({ _id: doc.user_id });
      formatted.push({
        _id: String(doc._id),
        user_id: doc.user_id,
        username: user?.username || doc.user_name || 'Tenant User',
        email: user?.email || doc.user_email || 'tenant@rentora.app',
        phone_num: user?.phone_num || '+91 98765 43210',
        id_type: doc.id_type || 'Aadhaar Card',
        id_number: doc.id_number || 'UID-3892-4912',
        full_name: doc.full_name || user?.username || 'Verified User',
        address_line: doc.address_line || 'Doorstep Delivery Address',
        id_proof_name: doc.id_proof_name || doc.id_proof || 'Government_ID.jpg',
        id_proof_preview: doc.id_proof_preview || doc.id_proof_mock_url || '',
        address_proof_name: doc.address_proof_name || doc.address_proof || 'Utility_Bill.pdf',
        address_proof_preview: doc.address_proof_preview || doc.address_proof_mock_url || '',
        status: doc.status || 'in_review',
        confidence_score: doc.confidence_score || 98.4,
        submitted_at: doc.submitted_at instanceof Date ? doc.submitted_at.toISOString() : doc.submitted_at,
        reviewed_at: doc.reviewed_at instanceof Date ? doc.reviewed_at.toISOString() : doc.reviewed_at,
        rejection_reason: doc.rejection_reason || null
      });
    }

    const pendingCount = formatted.filter(k => k.status === 'in_review' || k.status === 'pending').length;
    const approvedCount = formatted.filter(k => k.status === 'approved').length;
    const rejectedCount = formatted.filter(k => k.status === 'rejected').length;

    return res.status(200).json({
      stats: {
        total: formatted.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      submissions: formatted
    });
  } catch (err) {
    console.error('Admin KYC fetch error:', err);
    return res.status(500).json({ error: 'Internal server error fetching KYC submissions' });
  }
});

// PATCH /api/admin/kyc/:user_id/ or /api/admin/kyc/
router.patch(['/admin/kyc/:user_id/', '/admin/kyc/'], async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.user_id || req.body.user_id;
    const { status, rejection_reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    if (!status || !['approved', 'rejected', 'in_review'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved, rejected, in_review) is required' });
    }

    const updateFields = {
      status,
      reviewed_at: new Date(),
      rejection_reason: status === 'rejected' ? (rejection_reason || 'Document verification failed. Please upload clearer documents.') : null
    };

    await db.collection('kyc').updateOne(
      { user_id: userId },
      { $set: updateFields }
    );

    // Sync with users collection
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { kyc_verified: status === 'approved', kyc_status: status } }
    );

    try {
      const { notifyUser, notifyAdmin } = require('../socket');
      notifyUser(userId, 'kyc:status_update', {
        status,
        rejection_reason: updateFields.rejection_reason,
        message: status === 'approved' 
          ? '🎉 Great news! Your KYC has been verified and approved.' 
          : `⚠️ KYC Review Update: Status is ${status}. ${updateFields.rejection_reason || ''}`
      });
      notifyAdmin('admin:kyc_reviewed', {
        user_id: userId,
        status,
        rejection_reason: updateFields.rejection_reason
      });
    } catch (e) {
      console.warn('Socket KYC notification error:', e.message);
    }

    return res.status(200).json({
      success: `User KYC updated to ${status}`,
      status,
      rejection_reason: updateFields.rejection_reason
    });
  } catch (err) {
    console.error('Admin update KYC error:', err);
    return res.status(500).json({ error: 'Internal server error updating KYC' });
  }
});

// GET /api/admin/export/ - Comprehensive Enterprise CSV Export
router.get('/admin/export/', async (req, res) => {
  try {
    const db = getDb();
    const type = req.query.type || 'rentals';
    let data = [];
    let headers = [];
    let filename = `rentora_${type}_export.csv`;
    
    if (type === 'rentals') {
      const rentals = await db.collection('rentals').find({}).toArray();
      headers = [
        'rental_id', 'user_id', 'appliance_id', 'monthly_rent', 'security_deposit',
        'tenure_months', 'status', 'delivery_status', 'agent_name', 'delivery_otp',
        'rented_at', 'next_billing_date'
      ];
      data = rentals.map(r => ({
        rental_id: String(r._id),
        user_id: r.user_id,
        appliance_id: r.appliance_id,
        monthly_rent: r.monthly_rent,
        security_deposit: r.security_deposit,
        tenure_months: r.tenure,
        status: r.status,
        delivery_status: r.delivery_status || r.delivery_tracking?.current_stage || 'IN_PROGRESS',
        agent_name: r.delivery_tracking?.agent_name || 'Rajesh Patil',
        delivery_otp: r.delivery_tracking?.delivery_otp || '4829',
        rented_at: r.rented_at ? new Date(r.rented_at).toISOString().slice(0, 10) : '',
        next_billing_date: r.next_billing_date ? new Date(r.next_billing_date).toISOString().slice(0, 10) : ''
      }));
    } else if (type === 'financials') {
      const payments = await db.collection('payments').find({}).toArray();
      headers = [
        'transaction_id', 'invoice_number', 'user_name', 'user_email',
        'amount_rent', 'amount_deposit', 'amount_tax', 'amount_total',
        'payment_method', 'status', 'created_at'
      ];
      data = payments.map(p => ({
        transaction_id: p.transaction_id,
        invoice_number: p.invoice_number,
        user_name: p.user_name || 'Customer',
        user_email: p.user_email || '',
        amount_rent: p.amount_rent || 0,
        amount_deposit: p.amount_deposit || 0,
        amount_tax: p.amount_tax || 0,
        amount_total: p.amount_total || 0,
        payment_method: p.payment_method || 'UPI',
        status: p.status || 'SUCCESS',
        created_at: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : ''
      }));
    } else if (type === 'churn') {
      const churns = await db.collection('user_churn_scores').find({}).toArray();
      headers = ['username', 'email', 'churn_risk_score', 'risk_percentage', 'shap_reason', 'last_updated'];
      data = churns.map(c => ({
        username: c.username,
        email: c.email,
        churn_risk_score: c.churn_risk_score,
        risk_percentage: (parseFloat(c.churn_risk_score || 0) * 100).toFixed(1) + '%',
        shap_reason: c.shap_reason,
        last_updated: c.last_updated ? new Date(c.last_updated).toISOString().slice(0, 10) : ''
      }));
    } else if (type === 'users') {
      const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
      headers = ['user_id', 'username', 'email', 'phone_num', 'role', 'kyc_verified', 'created_at'];
      data = users.map(u => ({
        user_id: String(u._id),
        username: u.username,
        email: u.email,
        phone_num: u.phone_num || '',
        role: u.role || 'customer',
        kyc_verified: u.kyc_verified ? 'YES' : 'NO',
        created_at: u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : ''
      }));
    } else if (type === 'kyc') {
      const kycList = await db.collection('kyc').find({}).toArray();
      headers = ['user_id', 'full_name', 'id_type', 'id_number', 'status', 'rejection_reason', 'submitted_at'];
      data = kycList.map(k => ({
        user_id: k.user_id,
        full_name: k.full_name || '',
        id_type: k.id_type || 'Aadhaar Card',
        id_number: k.id_number || '',
        status: k.status || 'pending',
        rejection_reason: k.rejection_reason || 'N/A',
        submitted_at: k.submitted_at ? new Date(k.submitted_at).toISOString().slice(0, 10) : ''
      }));
    } else if (type === 'complaints') {
      const tickets = await db.collection('complaints').find({}).toArray();
      headers = ['ticket_id', 'customer_name', 'category', 'subject', 'status', 'resolution_notes', 'created_at'];
      data = tickets.map(t => ({
        ticket_id: t.ticket_id,
        customer_name: t.customer_name || 'Customer',
        category: t.category || 'Appliance Quality',
        subject: t.subject || '',
        status: t.status || 'OPEN',
        resolution_notes: t.resolution_notes || 'Pending Support Review',
        created_at: t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : ''
      }));
    }

    if (data.length === 0) {
      return res.status(404).json({ error: `No records found for export type: ${type}` });
    }

    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]).replace(/"/g, '""') : '';
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Add UTF-8 BOM so Excel opens with proper encoding
    const csvString = '\uFEFF' + csvRows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvString);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Internal server error during export' });
  }
});

module.exports = router;

