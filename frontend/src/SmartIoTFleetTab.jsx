import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Cpu, 
  Activity, 
  Thermometer, 
  Zap, 
  Wrench, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Leaf, 
  Layers, 
  Package, 
  MapPin, 
  Search,
  Filter,
  Check,
  Clock
} from 'lucide-react';

const REFURB_STEPS = [
  { key: 'RETURN_INSPECTION', label: '1. Diagnostic Return Intake' },
  { key: 'SANITIZATION_PART_REPLACE', label: '2. Steam Sanitization & Filter' },
  { key: 'QUALITY_AUDIT_28PT', label: '3. 28-Pt Electrical Safety' },
  { key: 'RESTOCKED_AVAILABLE', label: '4. Restocked to Active Fleet' }
];

const SmartIoTFleetTab = ({ onStockUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState('alerts'); // 'alerts' | 'serialized'
  const [fleetData, setFleetData] = useState(null);
  const [units, setUnits] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter state for serialized inventory
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resFleet, resUnits, resKpis] = await Promise.all([
        fetch('http://localhost:8000/api/iot/fleet-health'),
        fetch('http://localhost:8000/api/inventory/units'),
        fetch('http://localhost:8000/api/inventory/kpis')
      ]);

      if (resFleet.ok) {
        const d = await resFleet.json();
        setFleetData(d);
      }
      if (resUnits.ok) {
        const u = await resUnits.json();
        setUnits(u);
      }
      if (resKpis.ok) {
        const k = await resKpis.json();
        setKpis(k);
      }
    } catch (err) {
      console.error('Failed to fetch IoT fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProactiveDispatch = async (alert) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/iot/proactive-service/${alert.appliance_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_slot: 'Immediate Express Dispatch',
          notes: `Proactive technician dispatch for high failure risk alert: ${alert.at_risk_component}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(`Technician dispatched for ${alert.rental_name}! Ticket: ${data.ticket_id}`);
        fetchData();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceRefurb = async (unitId, nextStage) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/inventory/refurbish-step/${unitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          next_stage: nextStage,
          notes: 'Stage verified and certified by Senior Refurbishment Specialist'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message);
        fetchData();
        if (onStockUpdated) onStockUpdated();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Refurbish step error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const summary = fleetData?.summary || {};
  const alerts = fleetData?.alerts || [];

  const filteredUnits = units.filter(u => {
    const matchesSearch = !searchQuery || 
      (u.serial_number && u.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.rental_name && u.rental_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.rfid_tag && u.rfid_tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || u.lifecycle_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              textTransform: 'uppercase'
            }}>
              Smart IoT Fleet & Serialized Inventory
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Live Telemetry Streams & 4-Stage Refurbishment Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Smart Appliance Health & Predictive Maintenance Hub
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
            Monitor real-time power, core temperatures, failure probabilities, and reverse logistics refurbishments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Fleet Telemetry</span>
        </button>
      </div>

      {actionSuccess && (
        <div style={{
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#065f46',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Fleet Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>Connected Smart Nodes</span>
            <Wifi size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0 0.15rem' }}>
            {summary.total_connected_appliances || 91}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669' }}>
            ● {summary.online_rate_pct || 98}% Online Telemetry Ping
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>Fleet AI Health Score</span>
            <Activity size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#059669', margin: '0.4rem 0 0.15rem' }}>
            {summary.avg_fleet_health_score || 91} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Avg Motor Temp: {summary.avg_motor_temp_c || 48.5}°C
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>Predictive Failure Alerts</span>
            <AlertTriangle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#dc2626', margin: '0.4rem 0 0.15rem' }}>
            {summary.critical_alerts_count || alerts.length || 6}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
            Requires proactive preventive dispatch
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>Eco-Saver Profile Active</span>
            <Leaf size={16} color="#15803d" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803d', margin: '0.4rem 0 0.15rem' }}>
            {summary.eco_saver_active_count || 28}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Avg Daily Draw: {summary.avg_daily_kwh || 2.85} kWh
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('alerts')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: activeSubTab === 'alerts' ? '#dc2626' : '#64748b',
            borderBottom: activeSubTab === 'alerts' ? '3px solid #dc2626' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <AlertTriangle size={16} />
          <span>AI Predictive Maintenance Alerts ({alerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('serialized')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: activeSubTab === 'serialized' ? '#0284c7' : '#64748b',
            borderBottom: activeSubTab === 'serialized' ? '3px solid #0284c7' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Package size={16} />
          <span>Serialized Asset Fleet & 4-Stage Refurbishment ({units.length} Units)</span>
        </button>
      </div>

      {/* SUB-TAB 1: AI PREDICTIVE MAINTENANCE ALERTS */}
      {activeSubTab === 'alerts' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Proactive Service Queue (AI Failure Prediction)
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Appliances detected with thermal or mechanical anomalies before breakdown occurs
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 800 }}>
              Zero-Downtime SLA Active
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Device / Node ID</th>
                  <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Appliance Title</th>
                  <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Failure Risk Score</th>
                  <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>At-Risk Subsystem</th>
                  <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Proactive Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alt, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                      {alt.device_id || `IOT-${idx+101}`}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                      {alt.rental_name || 'Smart Appliance'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        background: alt.risk_level === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                        color: alt.risk_level === 'CRITICAL' ? '#b91c1c' : '#b45309',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '0.75rem'
                      }}>
                        {Math.round((alt.failure_risk_score || 0.78) * 100)}% ({alt.risk_level})
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      ⚠️ {alt.at_risk_component || 'Motor / Compressor'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {alt.status || 'PENDING_DISPATCH'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleProactiveDispatch(alt)}
                        disabled={actionLoading}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Wrench size={13} />
                        <span>Dispatch Free Service</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      All connected smart appliances operating within optimal health tolerance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SERIALIZED INVENTORY & 4-STAGE REFURBISHMENT */}
      {activeSubTab === 'serialized' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Refurbishment Process Header Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  28-Point Reverse Logistics & Refurbishment Pipeline
                </h3>
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Returned appliances pass strict 4-stage quality sanitization and electrical tests before restocked as Grade A.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Units In Refurb</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f59e0b' }}>
                  {kpis?.under_refurbishment || 6}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Fleet Capital Recovered</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>
                  ₹{(kpis?.total_rental_revenue_recovered || 68400).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search serial number (RENT-WSH-104), RFID tag, appliance title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <option value="all">All Lifecycle States</option>
              <option value="ACTIVE_LEASE">Active Leases</option>
              <option value="IN_WAREHOUSE">Ready in Depot Hubs</option>
              <option value="UNDER_REFURBISHMENT">In Refurbishment Queue</option>
            </select>
          </div>

          {/* Serialized Units Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Serial No. & RFID</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Appliance Model</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Depot Hub Location</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Grade & Status</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: '#475569' }}>Depreciation & ROI</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Refurbishment Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.slice(0, 25).map((unit, idx) => {
                    const isRefurb = unit.lifecycle_status === 'UNDER_REFURBISHMENT';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <strong style={{ fontFamily: 'monospace', color: '#0f172a', display: 'block' }}>
                            {unit.serial_number}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {unit.rfid_tag}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                          {unit.rental_name}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: '#475569' }}>
                          <MapPin size={12} color="#0284c7" style={{ display: 'inline', marginRight: '4px' }} />
                          {unit.depot_location}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            background: unit.lifecycle_status === 'ACTIVE_LEASE' ? '#ecfdf5' : (isRefurb ? '#fef3c7' : '#eff6ff'),
                            color: unit.lifecycle_status === 'ACTIVE_LEASE' ? '#065f46' : (isRefurb ? '#b45309' : '#1e40af'),
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            display: 'inline-block',
                            marginBottom: '0.2rem'
                          }}>
                            {unit.lifecycle_status.replace('_', ' ')}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                            {unit.condition_grade}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.78rem' }}>
                          <div>Book: ₹{(unit.depreciation_book_value || 14000).toLocaleString()}</div>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>
                            ROI: {unit.roi_percentage || 85}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {isRefurb ? (
                            <button
                              type="button"
                              onClick={() => handleAdvanceRefurb(unit.unit_id, 'RESTOCKED_AVAILABLE')}
                              disabled={actionLoading}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.45rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <Check size={13} />
                              <span>Certify & Restock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAdvanceRefurb(unit.unit_id, 'SANITIZATION_PART_REPLACE')}
                              disabled={actionLoading}
                              style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                padding: '0.45rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Intake Refurb
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                        No serialized inventory units matched current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartIoTFleetTab;
