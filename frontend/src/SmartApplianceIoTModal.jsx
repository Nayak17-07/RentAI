import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Zap, 
  Activity, 
  Thermometer, 
  Gauge, 
  Sparkles, 
  ShieldCheck, 
  Wrench, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Power, 
  SlidersHorizontal,
  Leaf,
  Clock,
  Radio
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';

const SmartApplianceIoTModal = ({ isOpen, onClose, rental }) => {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [isSelfTesting, setIsSelfTesting] = useState(false);
  const [selfTestProgress, setSelfTestProgress] = useState(0);

  const rentalId = rental?.rental_id || rental?._id;
  const applianceName = rental?.appliance?.rental_name || rental?.rental_name || 'Smart Household Appliance';

  const fetchTelemetry = async () => {
    if (!rentalId) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/iot/telemetry/${rentalId}`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error('Failed to fetch IoT telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && rentalId) {
      fetchTelemetry();
    }
  }, [isOpen, rentalId]);

  if (!isOpen || !rental) return null;

  const handleToggleEco = async () => {
    setActionLoading(true);
    setActionSuccess('');
    try {
      const res = await fetch(`http://localhost:8000/api/iot/controls/${rentalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_ECO' })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message);
        fetchTelemetry();
        setTimeout(() => setActionSuccess(''), 4500);
      }
    } catch (err) {
      console.error('Eco toggle error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunSelfTest = async () => {
    setIsSelfTesting(true);
    setSelfTestProgress(10);
    setActionSuccess('');

    const interval = setInterval(() => {
      setSelfTestProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 400);

    try {
      const res = await fetch(`http://localhost:8000/api/iot/controls/${rentalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_SELF_TEST' })
      });
      clearInterval(interval);
      setSelfTestProgress(100);
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setIsSelfTesting(false);
          setActionSuccess(data.message);
          fetchTelemetry();
          setTimeout(() => setActionSuccess(''), 5000);
        }, 600);
      } else {
        setIsSelfTesting(false);
      }
    } catch (err) {
      clearInterval(interval);
      setIsSelfTesting(false);
    }
  };

  const handleProactiveService = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/iot/proactive-service/${rentalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_slot: 'Express (Next 24 Hours)',
          notes: 'Customer triggered proactive preventive maintenance through Smart IoT Hub'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Proactive service booking error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const isEco = telemetry?.operating_mode === 'ECO_MODE';
  const healthScore = telemetry?.health_score || 94;
  const riskLevel = telemetry?.risk_level || 'LOW';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #38bdf8',
              borderRadius: '12px',
              padding: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Radio size={24} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Smart IoT Telemetry
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Node: {telemetry?.device_id || `IOT-${rentalId?.slice(-6).toUpperCase()}`}
                </span>
              </div>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {applianceName}
              </h3>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status banner */}
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

          {/* Quick Real-Time Status Bar */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: telemetry?.online_status === 'ONLINE' ? '#10b981' : '#f59e0b',
                display: 'inline-block',
                boxShadow: telemetry?.online_status === 'ONLINE' ? '0 0 8px #10b981' : 'none'
              }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                  {telemetry?.online_status === 'ONLINE' ? 'Active & Telemetry Streaming' : 'Appliance Standby'}
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Live ping: {new Date().toLocaleTimeString()} • 5G Micro-Gateway connected
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{
                background: isEco ? '#dcfce7' : '#f1f5f9',
                color: isEco ? '#15803d' : '#475569',
                border: `1px solid ${isEco ? '#86efac' : '#cbd5e1'}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Leaf size={14} color={isEco ? '#15803d' : '#64748b'} />
                <span>{isEco ? 'Eco-Saver Active (18% Savings)' : 'Standard Performance'}</span>
              </span>

              <button
                type="button"
                onClick={fetchTelemetry}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Core Telemetry Sensor Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {/* Health Score */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>AI Health Score</span>
                <Activity size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: healthScore > 85 ? '#059669' : '#d97706', marginTop: '0.4rem' }}>
                {healthScore} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem' }}>
                {healthScore > 85 ? 'Optimal operational state' : 'Requires minor calibration'}
              </div>
            </div>

            {/* Power Consumption */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Power Usage</span>
                <Zap size={16} color="#eab308" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
                {telemetry?.daily_energy_kwh || '2.45'} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>kWh/day</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem' }}>
                Cumulative: {telemetry?.cumulative_kwh || '142.8'} kWh
              </div>
            </div>

            {/* Core Motor Temperature */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Core Motor Temp</span>
                <Thermometer size={16} color="#ef4444" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
                {telemetry?.motor_temp_c || '48.2'}°C
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.3rem' }}>
                ✓ Safe margin (&lt;65°C rated)
              </div>
            </div>

            {/* Filter & Sanitization */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Filter / Gasket</span>
                <Sparkles size={16} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '0.4rem' }}>
                {telemetry?.filter_health_pct || 92}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem' }}>
                Vibration: {telemetry?.vibration_amplitude_mms || '1.84'} mm/s
              </div>
            </div>
          </div>

          {/* Predictive Maintenance & ML Analysis Section */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #bbf7d0',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={20} color="#059669" />
                <strong style={{ fontSize: '0.95rem', color: '#065f46' }}>
                  AI Predictive Maintenance Intelligence (Random Forest / Gradient Boosted)
                </strong>
              </div>
              <span style={{
                background: riskLevel === 'LOW' ? '#dcfce7' : '#fee2e2',
                color: riskLevel === 'LOW' ? '#15803d' : '#dc2626',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                Failure Risk: {Math.round((telemetry?.failure_risk_score || 0.08) * 100)}% ({riskLevel})
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
              {telemetry?.proactive_recommendation || 'All internal mechanical and electrical subsystems are operating within peak tolerance parameters.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                ⏱️ <strong>Remaining Useful Life (RUL):</strong> ~{telemetry?.remaining_useful_life_days || 140} Days before scheduled refurbishment check
              </div>

              <button
                type="button"
                onClick={handleProactiveService}
                disabled={actionLoading}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                }}
              >
                <Wrench size={14} />
                <span>{actionLoading ? 'Scheduling...' : 'Book Free Preventive Checkup (₹0)'}</span>
              </button>
            </div>
          </div>

          {/* Remote Smart Controls */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={18} color="#4f46e5" />
              <span>Remote Smart Appliance Controls</span>
            </h4>

            {isSelfTesting && (
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  <span>Scanning Micro-Sensors & Thermal Enclosure...</span>
                  <span>{selfTestProgress}%</span>
                </div>
                <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#4f46e5', width: `${selfTestProgress}%`, height: '100%', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* Eco Toggle Button */}
              <button
                type="button"
                onClick={handleToggleEco}
                disabled={actionLoading}
                style={{
                  background: isEco ? '#f0fdf4' : '#f8fafc',
                  border: `1.5px solid ${isEco ? '#86efac' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  background: isEco ? '#15803d' : '#94a3b8',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Leaf size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a' }}>
                    {isEco ? 'Disable Eco Mode' : 'Enable Eco-Saver'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {isEco ? 'Switch to Standard load' : 'Optimizes compressor frequency'}
                  </span>
                </div>
              </button>

              {/* Run Diagnostics Self-Test */}
              <button
                type="button"
                onClick={handleRunSelfTest}
                disabled={isSelfTesting || actionLoading}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RefreshCw size={18} className={isSelfTesting ? 'animate-spin' : ''} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a' }}>
                    Run 2.4s Diagnostic Scan
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Calibrate thermal & vibration sensors
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Protected by Rentora Shield • Free doorstep parts replacement included</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Close Telemetry Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartApplianceIoTModal;
