import React, { useState } from 'react';
import { X, MapPin, Zap, CheckCircle2, AlertCircle, Clock, Truck, ShieldCheck } from 'lucide-react';

const SERVICEABLE_PINCODES = {
  // Hyderabad
  '500081': { area: 'HITEC City & Madhapur, Hyderabad', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Kondapur Fulfillment Hub' },
  '500032': { area: 'Gachibowli & Financial District, Hyderabad', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Kondapur Fulfillment Hub' },
  '500034': { area: 'Banjara Hills, Hyderabad', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Secunderabad Hub' },
  '500033': { area: 'Jubilee Hills, Hyderabad', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Secunderabad Hub' },
  '500072': { area: 'Kukatpally, Hyderabad', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Kondapur Fulfillment Hub' },

  // Bangalore
  '560001': { area: 'MG Road & Central Bangalore', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Domlur Regional Hub' },
  '560100': { area: 'Electronic City, Bangalore', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Hosur Road Hub' },
  '560103': { area: 'Bellandur & Outer Ring Road, Bangalore', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Domlur Regional Hub' },
  '560037': { area: 'Marathahalli & Whitefield, Bangalore', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Whitefield Hub' },

  // Mumbai
  '400001': { area: 'Fort & South Mumbai', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Bhiwandi Central Hub' },
  '400050': { area: 'Bandra West, Mumbai', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Andheri Hub' },
  '400053': { area: 'Andheri West, Mumbai', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Andheri Hub' },
  '400076': { area: 'Powai, Mumbai', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Andheri Hub' },

  // Delhi NCR
  '110001': { area: 'Connaught Place & Central Delhi', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Okhla Logistics Center' },
  '122002': { area: 'DLF Cyber City, Gurgaon', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Gurgaon Hub' },
  '201301': { area: 'Sector 18 & Central Noida', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Noida Hub' },

  // Pune
  '411001': { area: 'Camp & Pune Station', deliveryTime: 'Delivery within 72 Hours', assembly: 'Free Professional Assembly', warehouse: 'Hadapsar Hub' },
  '411057': { area: 'Hinjawadi IT Park, Pune', deliveryTime: 'Guaranteed Express Delivery in 48 Hours', assembly: 'Free Same-Day Setup', warehouse: 'Wakad Hub' }
};

export default function PincodeCheckerModal({ isOpen, onClose, currentCity = 'Hyderabad' }) {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  const handleCheck = (e) => {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (!cleanPin || cleanPin.length !== 6) {
      alert("Please enter a valid 6-digit postal code.");
      return;
    }

    setChecked(true);
    if (SERVICEABLE_PINCODES[cleanPin]) {
      setResult({
        serviceable: true,
        ...SERVICEABLE_PINCODES[cleanPin],
        pincode: cleanPin
      });
    } else {
      // General serviceable city fallback
      setResult({
        serviceable: true,
        area: `${currentCity} Metro Area`,
        deliveryTime: 'Standard Delivery in 3-4 Working Days',
        assembly: 'Free Professional Assembly by Rentora Engineers',
        warehouse: `${currentCity} Regional Center`,
        pincode: cleanPin
      });
    }
  };

  const handleQuickSelect = (pin) => {
    setPincode(pin);
    setChecked(true);
    setResult({
      serviceable: true,
      ...SERVICEABLE_PINCODES[pin],
      pincode: pin
    });
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        padding: '2rem',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
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
            justifyContent: 'center'
          }}
        >
          <X size={16} color="#4b5563" />
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#e23744', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <Zap size={14} />
          <span>72-HOUR EXPRESS LOGISTICS</span>
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#111827' }}>
          Check Delivery in Your Area
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
          Enter your 6-digit delivery pincode to see express slot availability and warehouse transit estimates.
        </p>

        {/* Input Form */}
        <form onSubmit={handleCheck} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MapPin size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 500081 or 560001"
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#e23744'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#e23744',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0 1.4rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Check
          </button>
        </form>

        {/* Quick Example Pincodes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem', fontWeight: 600 }}>
            POPULAR EXPRESS HUBS:
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['500081 (HITEC City)', '560001 (Bangalore)', '400050 (Bandra)', '122002 (Gurgaon)'].map(item => {
              const pin = item.split(' ')[0];
              return (
                <button
                  key={pin}
                  type="button"
                  onClick={() => handleQuickSelect(pin)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.75rem',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Card */}
        {checked && result && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '14px',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                Express Delivery Available for {result.pincode}!
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, marginBottom: '0.75rem' }}>
              {result.area}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem', color: '#1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} color="#16a34a" />
                <span>{result.deliveryTime}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={14} color="#16a34a" />
                <span>Zero Delivery Fee + {result.assembly}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={14} color="#16a34a" />
                <span>Dispatched from: {result.warehouse}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
