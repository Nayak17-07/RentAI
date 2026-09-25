import React from 'react';
import { Truck, Wrench, RefreshCw, ShieldCheck, Clock, Award } from 'lucide-react';

export const AssuranceBanner = () => {
  const benefits = [
    {
      icon: Truck,
      title: "Free Relocation",
      subtitle: "Moving to a new house or city? We pack, move, and reinstall your rented items across 5 cities completely free.",
      tag: "Zero Moving Cost"
    },
    {
      icon: Wrench,
      title: "Free Annual Servicing",
      subtitle: "Periodic deep cleaning and technician visits with a guaranteed 72-hour repair or replacement SLA.",
      tag: "72-Hr Guarantee"
    },
    {
      icon: RefreshCw,
      title: "Easy Model Upgrades",
      subtitle: "Bored of an appliance? Upgrade to newer, bigger models after 6 months with zero foreclosure penalty.",
      tag: "Latest Tech"
    },
    {
      icon: ShieldCheck,
      title: "100% Refundable Deposit",
      subtitle: "Low security deposits transferred directly back to your bank account within 7 business days of lease return.",
      tag: "Direct Bank Refund"
    }
  ];

  return (
    <section style={{ maxWidth: '1280px', margin: '3.5rem auto 1rem', padding: '0 1.5rem' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #ebebeb',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef2f2', color: '#e23744', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Award size={14} /> The RentAI Assurance
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#111827' }}>
            Why Rent with <span style={{ color: '#e23744' }}>RentAI</span>?
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0.5rem 0 0', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            Enjoy the freedom of premium living with zero maintenance stress, zero moving costs, and flexible tenures.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div 
                key={idx}
                style={{
                  background: '#fafafa',
                  border: '1px solid #eeeeee',
                  borderRadius: '16px',
                  padding: '1.75rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#eeeeee';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    color: '#e23744',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    {b.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#111827' }}>
                  {b.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                  {b.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
