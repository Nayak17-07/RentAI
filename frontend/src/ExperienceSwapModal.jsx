import React, { useState } from 'react';
import { X, RefreshCw, ArrowRight, CheckCircle, Calendar, Sparkles, Clock } from 'lucide-react';

export default function ExperienceSwapModal({ isOpen, onClose, rental, catalog = [], onConfirmSwap }) {
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [exchangeDate, setExchangeDate] = useState('');
  const [exchangeSlot, setExchangeSlot] = useState('10:00 AM - 01:00 PM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !rental) return null;

  // Find eligible swap options (same category or similar)
  const category = rental.appliance?.category_id || 'General';
  const eligibleItems = catalog.filter(item => 
    item.appliance_id !== rental.appliance?.appliance_id &&
    (item.category_id?.toLowerCase() === category.toLowerCase() || category.toLowerCase() === 'general')
  );

  const handleSwapSubmit = (e) => {
    e.preventDefault();
    if (!selectedReplacement) {
      alert("Please select a new item to swap into.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      onConfirmSwap({
        oldRental: rental,
        newAppliance: selectedReplacement,
        exchangeDate: exchangeDate || 'in 3 business days',
        exchangeSlot: exchangeSlot,
        notes: notes
      });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '780px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <X size={16} color="#4b5563" />
        </button>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '2rem',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sparkles size={14} />
            <span>RENTORA SIGNATURE EXPERIENCE SWAP</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#ffffff' }}>
            Upgrade / Refresh Your Furniture
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
            Bored of your current style or need an upgrade? Swap your rental seamlessly. We deliver your new piece and pick up the old one at the exact same doorstep appointment.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSwapSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Currently Rented Item Card */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
              Current Item to Return:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem'
            }}>
              <img
                src={rental.appliance?.image_url}
                alt=""
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>
                  {rental.appliance?.rental_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Current Rent: ₹{rental.monthly_rent || rental.appliance?.monthly_price}/mo • Tenure: {rental.tenure} Months
                </div>
              </div>
              <div style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '0.3rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                Free Doorstep Pickup
              </div>
            </div>
          </div>

          {/* Select Replacement Item */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Select New Item to Swap Into:
              </div>
              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                {eligibleItems.length} styles available for immediate exchange
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '0.85rem',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '0.25rem'
            }}>
              {eligibleItems.slice(0, 9).map(item => {
                const isSelected = selectedReplacement?.appliance_id === item.appliance_id;
                const priceDiff = (item.monthly_price || 0) - (rental.monthly_rent || rental.appliance?.monthly_price || 0);

                return (
                  <div
                    key={item.appliance_id}
                    onClick={() => setSelectedReplacement(item)}
                    style={{
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ height: '90px', background: '#f8fafc', overflow: 'hidden' }}>
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '0.65rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', lineHeight: 1.2, height: '28px', overflow: 'hidden' }}>
                        {item.rental_name}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7' }}>
                          ₹{item.monthly_price}/mo
                        </span>
                        <span style={{ fontSize: '0.7rem', color: priceDiff > 0 ? '#b45309' : '#15803d', fontWeight: 600 }}>
                          {priceDiff === 0 ? 'Same Rent' : priceDiff > 0 ? `+₹${priceDiff}/mo` : `-₹${Math.abs(priceDiff)}/mo`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Exchange Date & Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                Preferred Exchange Date
              </label>
              <input
                type="date"
                required
                value={exchangeDate}
                onChange={(e) => setExchangeDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                Preferred Time Slot
              </label>
              <select
                value={exchangeSlot}
                onChange={(e) => setExchangeSlot(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  background: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM (Morning Slot)</option>
                <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM (Afternoon Slot)</option>
                <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Evening Slot)</option>
              </select>
            </div>
          </div>

          {/* Swap Policy Callout */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            fontSize: '0.8rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <CheckCircle size={16} color="#0284c7" />
            <span>Zero cancellation penalty • Free 1-to-1 doorstep swap • Security deposit transfers over automatically.</span>
          </div>

          {/* Footer Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedReplacement}
              style={{
                background: selectedReplacement ? '#0284c7' : '#9ca3af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.6rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: selectedReplacement ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: selectedReplacement ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
              }}
            >
              <RefreshCw size={15} />
              <span>{submitting ? 'Confirming Swap...' : 'Confirm Experience Swap'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
