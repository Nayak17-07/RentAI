import React from 'react';
import { Award, CheckCircle, ShieldCheck, Download, Printer, X, Sparkles, Building, Calendar, Hash, User, Tag } from 'lucide-react';

export default function OwnershipCertificateModal({ rental, onClose }) {
  if (!rental) return null;

  const buyout = rental.buyout_details || {};
  const certId = rental.certificate_id || buyout.ownership_certificate_id || 'CERT-OWN-OFFICIAL';
  const applianceName = rental.appliance?.rental_name || rental.rental_name || 'Home Appliance / Furniture';
  const category = rental.appliance?.category_id || 'Appliances';
  const ownerName = buyout.customer_name || localStorage.getItem('username') || 'Valued Tenant & Asset Owner';
  const transferDate = rental.ownership_transfer_date 
    ? new Date(rental.ownership_transfer_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '1.25rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '720px',
        width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        position: 'relative',
        maxHeight: '92vh',
        overflowY: 'auto',
        border: '1px solid #e2e8f0'
      }}>
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* Certificate Container with Royal Decorative Border */}
        <div style={{
          padding: '2.5rem 3rem',
          margin: '1.5rem',
          borderRadius: '16px',
          border: '3px double #d4af37',
          background: 'linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)',
          boxShadow: 'inset 0 0 20px rgba(212, 175, 55, 0.08)',
          position: 'relative'
        }}>
          
          {/* Watermark Logo Accent */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.03,
            pointerEvents: 'none'
          }}>
            <Award size={360} color="#1e1b4b" />
          </div>

          {/* Certificate Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Sparkles size={16} />
              <span>RENTORA ASSET EQUITY LIQUIDATION CERTIFICATE</span>
              <Sparkles size={16} />
            </div>
            
            <h1 style={{
              fontFamily: 'serif',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#1e1b4b',
              margin: '0.25rem 0 0.5rem',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              Certificate of Permanent Ownership
            </h1>
            
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Official Title Deed & Discharge of All Future Rental Subscriptions
            </div>

            <div style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '999px',
              padding: '0.25rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginTop: '0.75rem',
              fontFamily: 'monospace'
            }}>
              REGISTRY ID: {certId}
            </div>
          </div>

          {/* Legal Certification Statement */}
          <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            This is to certify that full legal title, absolute ownership rights, and risk of possession for the specified asset have been irrevocably transferred from <strong>Rentora Technologies India Pvt. Ltd.</strong> to the owner designated below pursuant to the completion of the <strong>Rent-to-Own Equity Buyout Agreement</strong>.
          </div>

          {/* Asset & Owner Detail Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            background: '#fafaf9',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Beneficiary / Registered Owner</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1c1917', marginTop: '0.2rem' }}>{ownerName}</div>
              <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, marginTop: '0.15rem' }}>✓ KYC Verified & Cleared</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Asset Description & Category</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1c1917', marginTop: '0.2rem' }}>{applianceName}</div>
              <div style={{ fontSize: '0.78rem', color: '#78716c', marginTop: '0.15rem' }}>Category: {category}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Title Transfer Date</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', marginTop: '0.2rem' }}>{transferDate}</div>
              <div style={{ fontSize: '0.75rem', color: '#78716c' }}>Invoice: {buyout.invoice_number || 'INV-SETTLED'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Residual Buyout Settlement</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#16a34a', marginTop: '0.2rem' }}>
                ₹{(buyout.total_paid_for_buyout || 0).toLocaleString('en-IN')} (Paid)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78716c' }}>Equity Credit Applied: ₹{(buyout.equity_credit || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Assured Warranty & Free Servicing Shield */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem'
          }}>
            <ShieldCheck size={28} color="#059669" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: 1.4 }}>
              <strong>1-Year Rentora Care Warranty Transferred:</strong> The owner retains 12 months of complimentary technician diagnostics, operational tune-ups, and genuine spare replacement with zero deductible.
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '1.5rem',
            borderTop: '1px dashed #d6d3d1'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Authorized Signatory</div>
              <div style={{ fontFamily: 'cursive', fontSize: '1.35rem', color: '#1e1b4b', margin: '0.25rem 0 0.15rem' }}>
                Vikramaditya Rao
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a8a29e' }}>VP of Asset Lifecycle & Finance</div>
              <div style={{ fontSize: '0.7rem', color: '#a8a29e' }}>Rentora Technologies India Pvt. Ltd.</div>
            </div>

            {/* Gold Seal Emblem */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              border: '3px dashed #d4af37',
              background: '#fef3c7',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
              textAlign: 'center'
            }}>
              <Award size={24} color="#b45309" />
              <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase', marginTop: '0.15rem' }}>
                OFFICIAL<br />SEAL
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div style={{
          padding: '1rem 2rem 1.5rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px'
        }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Print Deed</span>
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '10px',
              background: '#e23744',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close & View Assets
          </button>
        </div>

      </div>
    </div>
  );
}
