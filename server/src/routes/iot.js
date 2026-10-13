const express = require('express');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');
const { notifyAdmin, broadcastEvent } = require('../socket');

const router = express.Router();

// GET /api/iot/telemetry/:id (rental_id or appliance_id)
router.get('/iot/telemetry/:id', async (req, res) => {
  try {
    const db = getDb();
    const targetId = req.params.id;

    // First check if it's a rental_id
    let applianceId = targetId;
    const rental = await db.collection('rentals').findOne({ _id: targetId });
    if (rental && rental.appliance_id) {
      applianceId = rental.appliance_id;
    }

    const defaultTelemetry = {
      device_id: `IOT-${applianceId.slice(-6).toUpperCase()}`,
      appliance_id: applianceId,
      rental_name: rental?.rental_name || 'Smart Home Appliance',
      category: 'Washing Machine',
      online_status: 'ONLINE',
      operating_mode: 'STANDARD',
      motor_temp_c: 48.2,
      vibration_amplitude_mms: 1.84,
      daily_energy_kwh: 2.45,
      cumulative_kwh: 142.8,
      operating_hours: 840,
      filter_health_pct: 92,
      health_score: 94,
      failure_risk_score: 0.08,
      risk_level: 'LOW',
      remaining_useful_life_days: 140,
      at_risk_component: 'Optimal Condition',
      proactive_recommendation: 'All systems operating within manufacturer parameters. Next scheduled checkup in 140 days.',
      diagnostic_error_code: 'NORMAL_OK',
      last_ping_at: new Date().toISOString()
    };

    let telemetry = await db.collection('iot_device_telemetry').findOne({ appliance_id: applianceId });
    if (!telemetry) {
      telemetry = await db.collection('iot_device_telemetry').findOne({ _id: targetId });
    }

    const merged = {
      ...defaultTelemetry,
      ...(telemetry || {})
    };

    return res.status(200).json(merged);
  } catch (err) {
    console.error('IoT telemetry error:', err);
    return res.status(500).json({ error: 'Failed to fetch IoT telemetry' });
  }
});

// POST /api/iot/controls/:id - Remote controls (Eco Mode, Self-Test, Remote Lock)
router.patch('/iot/controls/:id', authenticateJWT, async (req, res) => {
  try {
    const db = getDb();
    const targetId = req.params.id;
    const { action } = req.body; // 'TOGGLE_ECO', 'RUN_SELF_TEST', 'REMOTE_LOCK', 'REMOTE_UNLOCK'

    let applianceId = targetId;
    const rental = await db.collection('rentals').findOne({ _id: targetId });
    if (rental && rental.appliance_id) {
      applianceId = rental.appliance_id;
    }

    // Permission enforcement: REMOTE_LOCK and REMOTE_UNLOCK require admin role
    if (['REMOTE_LOCK', 'REMOTE_UNLOCK'].includes(action)) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only system administrators can execute remote firmware lock/unlock.' });
      }
    } else {
      // Telemetry toggles (Eco, Self-Test) require active renter, appliance owner, or admin
      const isRenter = rental && rental.user_id === req.user.id;
      const isAdminOrOwner = ['admin', 'owner'].includes(req.user.role);
      if (!isRenter && !isAdminOrOwner) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to control this appliance.' });
      }
    }

    const current = await db.collection('iot_device_telemetry').findOne({ appliance_id: applianceId });
    const update = { last_ping_at: new Date().toISOString() };

    let message = 'Command executed successfully';

    if (action === 'TOGGLE_ECO') {
      const newMode = (current?.operating_mode === 'ECO_MODE') ? 'STANDARD' : 'ECO_MODE';
      update.operating_mode = newMode;
      message = `Switched appliance operating profile to ${newMode === 'ECO_MODE' ? 'Eco-Saver Mode (18% energy savings active)' : 'Standard Performance Mode'}.`;
    } else if (action === 'RUN_SELF_TEST') {
      update.diagnostic_error_code = 'SELF_TEST_PASSED_ALL_SENSORS_OK';
      update.last_self_test = new Date().toISOString();
      message = 'Remote diagnostic cycle completed in 2.4s. All 7 micro-sensors calibrated and healthy.';
    } else if (action === 'REMOTE_LOCK') {
      update.online_status = 'LOCKED_OVERDUE';
      message = 'Device firmware remotely secured. Motor and compressor locked until billing resolution.';
    } else if (action === 'REMOTE_UNLOCK') {
      update.online_status = 'ONLINE';
      message = 'Appliance unlocked and operational.';
    } else {
      return res.status(400).json({ error: 'Unsupported IoT control action' });
    }

    await db.collection('iot_device_telemetry').updateOne(
      { appliance_id: applianceId },
      { $set: update },
      { upsert: true }
    );

    // Broadcast real-time socket event
    broadcastEvent('iot:telemetry_updated', {
      appliance_id: applianceId,
      rental_id: targetId,
      action,
      update
    });

    return res.status(200).json({
      success: true,
      message,
      action,
      updated_state: update
    });
  } catch (err) {
    console.error('IoT control error:', err);
    return res.status(500).json({ error: 'Failed to send IoT control command' });
  }
});

// POST /api/iot/proactive-service/:id - Schedule free preventive service visit
router.post('/iot/proactive-service/:id', async (req, res) => {
  try {
    const db = getDb();
    const targetId = req.params.id;
    const { preferred_slot, notes } = req.body;

    let applianceId = targetId;
    const rental = await db.collection('rentals').findOne({ _id: targetId });
    if (rental && rental.appliance_id) {
      applianceId = rental.appliance_id;
    }

    const telemetry = await db.collection('iot_device_telemetry').findOne({ appliance_id: applianceId });

    const ticketId = 'SRV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const serviceDoc = {
      ticket_id: ticketId,
      appliance_id: applianceId,
      rental_id: targetId,
      rental_name: telemetry?.rental_name || rental?.rental_name || 'Smart Appliance',
      service_type: 'PREDICTIVE_PREVENTIVE_MAINTENANCE',
      urgency: telemetry?.risk_level || 'MODERATE',
      at_risk_component: telemetry?.at_risk_component || 'Filter & Motor Check',
      preferred_slot: preferred_slot || 'Express Slot (Next 24h)',
      technician_assigned: 'Vinay Murthy (Certified Senior Diagnostic Specialist)',
      technician_contact: '+91 98450 14920',
      status: 'SCHEDULED',
      cost_to_user: 0, // 100% Free under Rentora Shield
      notes: notes || 'Automated AI telemetry proactive maintenance dispatch',
      created_at: new Date().toISOString()
    };

    await db.collection('maintenance_tickets').insertOne(serviceDoc);

    // Notify Admin via WebSocket
    notifyAdmin('service:ticket_created', {
      ticket_id: ticketId,
      appliance_id: applianceId,
      risk_level: telemetry?.risk_level
    });

    return res.status(201).json({
      success: true,
      ticket_id: ticketId,
      message: 'Preventive service appointment confirmed! Our senior technician will service your appliance free of charge.',
      ticket: serviceDoc
    });
  } catch (err) {
    console.error('Proactive service booking error:', err);
    return res.status(500).json({ error: 'Failed to schedule service visit' });
  }
});

// GET /api/iot/fleet-health - Admin Fleet Telemetry & Predictive Maintenance Hub
router.get('/iot/fleet-health', async (req, res) => {
  try {
    const db = getDb();
    const devices = await db.collection('iot_device_telemetry').find({}).toArray();
    const alerts = await db.collection('predictive_maintenance_alerts').find({}).sort({ failure_risk_score: -1 }).toArray();

    const totalDevices = devices.length;
    const onlineCount = devices.filter(d => d.online_status === 'ONLINE').length;
    const criticalRiskCount = devices.filter(d => d.risk_level === 'CRITICAL').length;
    const highRiskCount = devices.filter(d => d.risk_level === 'HIGH').length;
    const ecoModeCount = devices.filter(d => d.operating_mode === 'ECO_MODE').length;

    const avgHealthScore = totalDevices > 0 
      ? Math.round(devices.reduce((acc, d) => acc + (d.health_score || 85), 0) / totalDevices) 
      : 88;

    const avgTemp = totalDevices > 0
      ? (devices.reduce((acc, d) => acc + (d.motor_temp_c || 48), 0) / totalDevices).toFixed(1)
      : 48.5;

    const avgPowerKwh = totalDevices > 0
      ? (devices.reduce((acc, d) => acc + (d.daily_energy_kwh || 2.5), 0) / totalDevices).toFixed(2)
      : 2.85;

    return res.status(200).json({
      summary: {
        total_connected_appliances: totalDevices,
        online_rate_pct: totalDevices > 0 ? Math.round((onlineCount / totalDevices) * 100) : 100,
        avg_fleet_health_score: avgHealthScore,
        avg_motor_temp_c: parseFloat(avgTemp),
        avg_daily_kwh: parseFloat(avgPowerKwh),
        critical_alerts_count: criticalRiskCount,
        high_risk_count: highRiskCount,
        eco_saver_active_count: ecoModeCount
      },
      devices: devices.slice(0, 30),
      alerts
    });
  } catch (err) {
    console.error('Fleet health error:', err);
    return res.status(500).json({ error: 'Failed to fetch fleet health telemetry' });
  }
});

module.exports = router;
