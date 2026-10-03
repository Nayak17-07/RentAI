import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Calendar, 
  KeyRound, 
  Copy, 
  Check, 
  AlertCircle,
  Wrench,
  Sparkles,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';

const STAGES = [
  { key: 'ORDER_CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
  { key: 'KYC_VERIFIED', label: 'KYC Approved', icon: ShieldCheck },
  { key: 'QUALITY_CHECK', label: '28-Pt Sanitization', icon: Sparkles },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered & Installed', icon: Wrench }
];

const DeliveryTrackerModal = ({ isOpen, onClose, rental, onRentalUpdated }) => {
  const [copied, setCopied] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleSlot, setRescheduleSlot] = useState(
    rental?.delivery_tracking?.slot || rental?.delivery_address?.delivery_slot || 'Morning Slot (10:00 AM – 01:00 PM)'
  );
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('Personal schedule change');
  const [reschedulingLoading, setReschedulingLoading] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');

  if (!isOpen || !rental) return null;

  const tracking = rental.delivery_tracking || {};
  const address = rental.delivery_address || {};
  const currentStage = tracking.current_stage || rental.delivery_status || 'QUALITY_CHECK';
  const otp = tracking.delivery_otp || '4829';

  const getStageIndex = (stageKey) => {
    const idx = STAGES.findIndex(s => s.key === stageKey);
    return idx >= 0 ? idx : 2; // Default to quality check
  };

  const currentIdx = getStageIndex(currentStage);

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setReschedulingLoading(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/rentals/${rental.rental_id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          new_slot: rescheduleSlot,
          new_date: rescheduleDate,
          reason: rescheduleReason
        })
      });

      if (res.ok) {
        setRescheduleSuccess(`Delivery appointment successfully moved to ${rescheduleSlot}!`);
        setIsRescheduling(false);
        if (onRentalUpdated) {
          onRentalUpdated();
        }
        setTimeout(() => setRescheduleSuccess(''), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reschedule delivery');
      }
    } catch (err) {
      console.error('Error rescheduling:', err);
      alert('Network error while rescheduling');
    } finally {
      setReschedulingLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 1150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '680px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                background: '#e23744',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Live Logistics Tracker
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                #{tracking.tracking_id || 'TRK-RENAI'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              {rental.appliance?.rental_name || 'Appliance Delivery'}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.75rem', maxHeight: 'calc(85vh - 70px)', overflowY: 'auto' }}>
          
          {rescheduleSuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              color: '#065f46',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>{rescheduleSuccess}</span>
            </div>
          )}

          {/* Secure Handover OTP Banner (Industry Standard) */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                <KeyRound size={15} />
                <span>Doorstep Handover OTP</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d', maxWidth: '340px', lineHeight: 1.4 }}>
                Share this secure code with your Rentora technician <strong>only after</strong> physical unboxing, positioning, and test operation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: '#ffffff',
                border: '2px dashed #16a34a',
                borderRadius: '10px',
                padding: '0.45rem 1.15rem',
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#15803d',
                letterSpacing: '0.25em',
                fontFamily: 'monospace',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {otp}
              </div>
              <button
                onClick={handleCopyOtp}
                title="Copy Handover OTP"
                style={{
                  background: '#ffffff',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: copied ? '#16a34a' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '1rem' }}>
              {/* Progress Track Line */}
              <div style={{
                position: 'absolute',
                top: '18px',
                left: '20px',
                right: '20px',
                height: '4px',
                background: '#e2e8f0',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                top: '18px',
                left: '20px',
                width: `${(currentIdx / (STAGES.length - 1)) * 92}%`,
                height: '4px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                zIndex: 2,
                transition: 'width 0.4s ease'
              }} />

              {/* Steps */}
              {STAGES.map((s, index) => {
                const IconComponent = s.icon;
                const isPassed = index < currentIdx;
                const isCurrent = index === currentIdx;

                return (
                  <div key={s.key} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px', textAlign: 'center' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isPassed ? '#10b981' : (isCurrent ? '#e23744' : '#f1f5f9'),
                      border: isCurrent ? '3px solid #fecdd3' : (isPassed ? '2px solid #059669' : '2px solid #cbd5e1'),
                      color: isPassed || isCurrent ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(226, 55, 68, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      marginBottom: '0.4rem'
                    }}>
                      <IconComponent size={17} />
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: isCurrent ? 800 : (isPassed ? 600 : 500),
                      color: isCurrent ? '#e23744' : (isPassed ? '#0f172a' : '#94a3b8'),
                      lineHeight: 1.2
                    }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ETA & Scheduled Slot Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Clock size={14} color="#0284c7" />
                <span>Estimated Arrival & Installation Window</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {tracking.estimated_delivery || 'Within 24–48 Hours'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.1rem' }}>
                Slot: <strong>{tracking.slot || address.delivery_slot || 'Express Delivery'}</strong>
              </div>
            </div>

            <button
              onClick={() => setIsRescheduling(!isRescheduling)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #0284c7',
                color: '#0284c7',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              <Calendar size={14} />
              <span>{isRescheduling ? 'Cancel Reschedule' : 'Reschedule Slot'}</span>
            </button>
          </div>

          {/* Reschedule Drawer Form */}
          {isRescheduling && (
            <form onSubmit={handleRescheduleSubmit} style={{
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              animation: 'fadeIn 0.2s ease'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#0369a1' }}>
                Change Delivery & Assembly Slot
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#0284c7' }}>
                Need to change the delivery window? Our logistics fleet will adjust technician route with ₹0 rescheduling penalty.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Select New Time Slot
                  </label>
                  <select
                    value={rescheduleSlot}
                    onChange={(e) => setRescheduleSlot(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Morning Slot (10:00 AM – 01:00 PM)">Morning Slot (10:00 AM – 01:00 PM)</option>
                    <option value="Evening Slot (04:00 PM – 07:00 PM)">Evening Slot (04:00 PM – 07:00 PM)</option>
                    <option value="Weekend Slot (Saturday / Sunday)">Weekend Slot (Saturday / Sunday)</option>
                    <option value="Express (Within 24-48 Hours)">Express (Within 24-48 Hours)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Preferred Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reschedulingLoading}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: reschedulingLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {reschedulingLoading ? 'Updating...' : 'Confirm Rescheduled Slot'}
                </button>
              </div>
            </form>
          )}

          {/* Assigned Technician & Delivery Partner */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#eff6ff',
                border: '2px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1d4ed8'
              }}>
                <UserCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  {tracking.courier_partner || 'Rentora Direct White-Glove Fleet'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {tracking.agent_name || 'Rajesh Patil (Field Lead)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                  <span>Vehicle: <strong>{tracking.vehicle_number || 'KA-01-EL-9284'}</strong></span>
                  <span>•</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Verified & Vaccinated</span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${tracking.agent_phone || '+919845012891'}`}
              style={{
                textDecoration: 'none',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                color: '#1e293b',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.color = '#16a34a'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#1e293b'; }}
            >
              <Phone size={14} color="#16a34a" />
              <span>Call Technician</span>
            </a>
          </div>

          {/* Delivery Destination */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              <MapPin size={14} color="#e23744" />
              <span>Installation Destination Address</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
              {address.recipient_name || 'Customer'} {address.phone && `(+91 ${address.phone})`}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem', lineHeight: 1.4 }}>
              {address.house_flat && `${address.house_flat}, `}
              {address.street_area && `${address.street_area}, `}
              {address.landmark && `Near ${address.landmark}, `}
              {address.city || 'Bangalore'} - {address.pincode}
            </div>
          </div>

          {/* Detailed Timeline Events */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
              Detailed Tracking History
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(tracking.timeline || []).map((t, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: t.completed ? '#10b981' : '#f1f5f9',
                    border: t.completed ? '2px solid #059669' : '2px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    {t.completed && <Check size={11} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: t.completed ? '#0f172a' : '#64748b' }}>
                        {t.title}
                      </span>
                      {t.timestamp && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.35 }}>
                      {t.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* White Glove Assembly Guarantee */}
          <div style={{
            marginTop: '1.5rem',
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Sparkles size={20} color="#9333ea" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.75rem', color: '#6b21a8', lineHeight: 1.35 }}>
              <strong>Rentora White-Glove Standard:</strong> Free doorstep assembly, pipe & power connection, 100% packaging material removal, and demo guaranteed on every delivery.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackerModal;
