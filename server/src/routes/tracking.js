const express = require('express');
const { getDb } = require('../db');
const { authenticateJWT } = require('../auth');
const { broadcastEvent } = require('../socket');

const router = express.Router();

// City Hub GPS Anchors
const CITY_COORDINATES = {
  Bangalore: {
    hub: { name: 'Whitefield Fulfillment Hub', lat: 12.9698, lng: 77.7499 },
    dest: { name: 'Customer Residence (Koramangala 4th Block)', lat: 12.9352, lng: 77.6245 }
  },
  Mumbai: {
    hub: { name: 'Bhiwandi Central Mega-Depot', lat: 19.2967, lng: 73.0631 },
    dest: { name: 'Customer Residence (Bandra West)', lat: 19.0596, lng: 72.8295 }
  },
  Delhi: {
    hub: { name: 'Okhla Phase-III Logistics Center', lat: 28.5355, lng: 77.2732 },
    dest: { name: 'Customer Residence (Hauz Khas Enclave)', lat: 28.5494, lng: 77.2001 }
  },
  Hyderabad: {
    hub: { name: 'Gachibowli High-Tech Depot', lat: 17.4401, lng: 78.3489 },
    dest: { name: 'Customer Residence (Jubilee Hills)', lat: 17.4319, lng: 78.4073 }
  },
  Pune: {
    hub: { name: 'Hinjawadi Phase-1 Distribution Hub', lat: 18.5913, lng: 73.7389 },
    dest: { name: 'Customer Residence (Koregaon Park)', lat: 18.5362, lng: 73.8940 }
  }
};

// Generates an interpolated GPS polyline route between hub and destination
function generateRouteWaypoints(start, end, steps = 12) {
  const waypoints = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add realistic subtle road curve perturbation
    const curveOffsetLat = Math.sin(ratio * Math.PI) * 0.008;
    const curveOffsetLng = Math.cos(ratio * Math.PI * 0.5) * 0.006;
    waypoints.push({
      step: i,
      lat: Number((start.lat + (end.lat - start.lat) * ratio + curveOffsetLat).toFixed(6)),
      lng: Number((start.lng + (end.lng - start.lng) * ratio + curveOffsetLng).toFixed(6))
    });
  }
  return waypoints;
}

// GET /api/tracking/live/:rental_id
router.get('/tracking/live/:rental_id', async (req, res) => {
  try {
    const db = getDb();
    const rentalId = req.params.rental_id;

    const rental = await db.collection('rentals').findOne({ _id: rentalId });

    // Determine city
    const cityName = rental?.delivery_address?.city || 'Bangalore';
    const cityCoords = CITY_COORDINATES[cityName] || CITY_COORDINATES['Bangalore'];

    const waypoints = generateRouteWaypoints(cityCoords.hub, cityCoords.dest, 10);

    // Current position index (simulate dynamic progress based on timestamp or stage)
    const currentStage = rental?.delivery_tracking?.current_stage || rental?.delivery_status || 'OUT_FOR_DELIVERY';

    let progressRatio = 0.65; // Default: halfway on route
    if (currentStage === 'ORDER_CONFIRMED') progressRatio = 0.05;
    else if (currentStage === 'KYC_VERIFIED') progressRatio = 0.20;
    else if (currentStage === 'QUALITY_CHECK') progressRatio = 0.40;
    else if (currentStage === 'OUT_FOR_DELIVERY') progressRatio = 0.75;
    else if (currentStage === 'DELIVERED') progressRatio = 1.0;

    const waypointIndex = Math.min(waypoints.length - 1, Math.round(progressRatio * (waypoints.length - 1)));
    const currentPos = waypoints[waypointIndex];

    const distanceTotalKm = 14.8;
    const distanceRemainingKm = Number((distanceTotalKm * (1.0 - progressRatio)).toFixed(1));
    const etaMinutes = Math.max(4, Math.round(distanceRemainingKm * 3.5));

    const trackingData = {
      rental_id: rentalId,
      tracking_id: rental?.delivery_tracking?.tracking_id || `TRK-${rentalId.slice(-6).toUpperCase()}`,
      mode: 'DELIVERY', // 'DELIVERY', 'RETURN_PICKUP', 'SERVICE_VISIT'
      current_stage: currentStage,
      driver_name: rental?.delivery_tracking?.agent_name || 'Rajesh Patil (Senior Field Specialist)',
      driver_phone: rental?.delivery_tracking?.agent_phone || '+91 98450 12891',
      driver_rating: 4.92,
      vehicle_type: 'Eco-Electric Refrigerated Van',
      vehicle_number: rental?.delivery_tracking?.vehicle_number || 'KA-01-EL-9284',
      delivery_otp: rental?.delivery_tracking?.delivery_otp || '4829',
      speed_kmh: currentStage === 'OUT_FOR_DELIVERY' ? 28 : 0,
      heading_degrees: 142,
      distance_total_km: distanceTotalKm,
      distance_remaining_km: distanceRemainingKm,
      eta_minutes: etaMinutes,
      eta_formatted: `${etaMinutes} mins (${distanceRemainingKm} km remaining)`,
      origin_hub: cityCoords.hub,
      destination: {
        ...cityCoords.dest,
        address: rental?.delivery_address?.street || 'Customer Doorstep',
        pincode: rental?.delivery_address?.pincode || '560034'
      },
      current_location: currentPos,
      waypoints: waypoints,
      last_updated: new Date().toISOString()
    };

    return res.status(200).json(trackingData);
  } catch (err) {
    console.error('Live tracking error:', err);
    return res.status(500).json({ error: 'Failed to retrieve real-time tracking data' });
  }
});

// POST /api/tracking/simulate-advance/:rental_id - Advance driver progress for demonstration
router.post('/tracking/simulate-advance/:rental_id', async (req, res) => {
  try {
    const db = getDb();
    const rentalId = req.params.rental_id;

    broadcastEvent('delivery:location_update', {
      rental_id: rentalId,
      delta: 'ADVANCED_2_KM',
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ success: true, message: 'Simulated vehicle advanced on live GPS track' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to simulate tracking movement' });
  }
});

module.exports = router;
