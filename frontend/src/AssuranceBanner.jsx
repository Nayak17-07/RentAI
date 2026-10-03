import React from 'react';
import { Truck, Wrench, RefreshCw, ShieldCheck, Zap, Sparkles, Award } from 'lucide-react';

export const AssuranceBanner = ({ onOpenUNLMTD }) => {
  const benefits = [
    {
      icon: Sparkles,
      title: "UNLMTD Subscriptions",
      subtitle: "Furnish your entire 1 BHK or 2 BHK for one flat monthly price with 0 security deposit and annual style upgrades.",
      tag: "Rentora Signature",
      isAction: true
    },
    {
      icon: RefreshCw,
      title: "Experience Swap",
      subtitle: "Bored of your decor? Swap any furniture piece for a fresh aesthetic anytime with zero cancellation penalty.",
      tag: "Free Style Refresh"
    },
    {
      icon: ShieldCheck,
      title: "₹10,000 Damage Waiver",
      subtitle: "Accidental spills, pet scratches, or minor tears? Our Rentora Shield covers up to ₹10,000 with ₹0 deduction.",
      tag: "Zero Anxiety"
    },
    {
      icon: Zap,
      title: "72-Hour Express Setup",
      subtitle: "Delivered and professionally assembled in your home within 72 hours by certified Rentora service technicians.",
      tag: "Express Logistics"
    },
    {
      icon: Truck,
      title: "Free Intercity Relocation",
      subtitle: "Relocating between cities? We dismantle, pack, transport, and reinstall your rented items completely free.",
      tag: "5 Major Metros"
    }
  ];

  return (
    <section style={{ maxWidth: '1280px', margin: '3.5rem auto 1rem', padding: '0 1.5rem' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #ebebeb',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef2f2', color: '#e23744', padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            <Award size={14} /> The Signature Experience on Rentora
          </div>
          <h2 style={{ fontSize: '1.95rem', fontWeight: 800, margin: 0, color: '#111827' }}>
            Why Choose <span style={{ color: '#e23744' }}>Rentora</span>?
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0.5rem 0 0', maxWidth: '580px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            Enjoy the asset-light lifestyle: furnish your entire home, swap styles whenever you want, and never worry about accidental damage or moving hassles.
          </p>
        </div>

        {/* 5 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div 
                key={idx}
                onClick={() => {
                  if (b.isAction && onOpenUNLMTD) onOpenUNLMTD();
                }}
                style={{
                  background: b.isAction ? '#fff5f5' : '#fafafa',
                  border: b.isAction ? '1.5px solid #fecaca' : '1px solid #eeeeee',
                  borderRadius: '16px',
                  padding: '1.5rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  cursor: b.isAction ? 'pointer' : 'default'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#e23744';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = b.isAction ? '#fecaca' : '#eeeeee';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: b.isAction ? '#e23744' : '#fef2f2',
                    color: b.isAction ? '#ffffff' : '#e23744',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: b.isAction ? '#b91c1c' : '#059669', background: b.isAction ? '#fee2e2' : '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {b.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#111827' }}>
                  {b.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.45, margin: 0 }}>
                  {b.subtitle}
                </p>

                {b.isAction && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#e23744', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>Explore UNLMTD Plans →</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
