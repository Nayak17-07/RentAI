import React, { useState } from 'react';
import { X } from 'lucide-react';

function ProductDetailsModal({ appliance, onClose, onAddToCart }) {
  const [tenure, setTenure] = useState('3');
  const [isAdding, setIsAdding] = useState(false);

  if (!appliance) return null;

  const pricing = appliance.pricing || {
    "3": appliance.monthly_price,
    "6": Math.round(appliance.monthly_price * 0.9),
    "12": Math.round(appliance.monthly_price * 0.8)
  };
  
  const securityDeposit = appliance.security_deposit || Math.round(appliance.monthly_price * 1.5);
  const currentRent = pricing[tenure];

  const handleAdd = async () => {
    setIsAdding(true);
    await onAddToCart(appliance.appliance_id, tenure);
    setIsAdding(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '1.5rem', overflow: 'hidden', maxWidth: '56rem', 
        width: '100%', display: 'flex', flexWrap: 'wrap',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '0.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <X size={24} color="#3f3f46" />
        </button>
        
        <div style={{
          flex: '1 1 300px', backgroundColor: '#f4f4f5', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', padding: '2rem'
        }}>
          <img 
            src={appliance.image_url} 
            alt={appliance.rental_name} 
            style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', mixBlendMode: 'multiply' }}
          />
        </div>
        
        <div style={{
          flex: '1 1 300px', padding: '2rem', display: 'flex', flexDirection: 'column'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{appliance.category_id}</span>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#18181b', margin: '0 0 1rem 0' }}>{appliance.rental_name}</h2>
          <p style={{ color: '#52525b', marginBottom: '2rem' }}>{appliance.description}</p>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 600, color: '#18181b', margin: '0 0 1rem 0' }}>Select Tenure</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem' }}>
              {['3', '6', '12'].map(t => (
                <button
                  key={t}
                  onClick={() => setTenure(t)}
                  style={{
                    border: tenure === t ? '2px solid var(--primary-color)' : '2px solid #e4e4e7',
                    backgroundColor: tenure === t ? 'var(--primary-glow)' : 'transparent',
                    color: tenure === t ? 'var(--primary-color)' : '#71717a',
                    borderRadius: '0.75rem', padding: '0.75rem 0.5rem', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{t} Months</div>
                  <div style={{ fontSize: '0.875rem' }}>₹{pricing[t]}/mo</div>
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ backgroundColor: '#fafafa', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f4f4f5' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '0.25rem' }}>Security Deposit</div>
              <div style={{ fontWeight: 600, color: '#18181b' }}>₹{securityDeposit}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#71717a', marginBottom: '0.25rem' }}>Monthly Rent</div>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary-color)' }}>₹{currentRent}</div>
            </div>
          </div>
          
          <button 
            onClick={handleAdd}
            disabled={isAdding}
            style={{
              marginTop: 'auto', width: '100%', backgroundColor: 'var(--primary-color)', color: 'white',
              fontWeight: 700, padding: '1rem', borderRadius: '0.75rem', border: 'none', cursor: isAdding ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', opacity: isAdding ? 0.7 : 1
            }}
          >
            {isAdding ? 'Adding...' : `Add to Cart • ₹${currentRent + securityDeposit} Due Today`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;
