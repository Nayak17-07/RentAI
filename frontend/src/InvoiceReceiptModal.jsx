import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText, ArrowDownToLine } from 'lucide-react';

const InvoiceReceiptModal = ({ isOpen, onClose, invoiceData }) => {
  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const items = invoiceData.items_summary || (invoiceData.rental_name ? [{
    rental_name: invoiceData.rental_name,
    category_id: invoiceData.category_id || 'Appliance',
    tenure: invoiceData.tenure || '3',
    monthly_price: invoiceData.monthly_rent || invoiceData.amount_rent,
    security_deposit: invoiceData.security_deposit || invoiceData.amount_deposit
  }] : []);

  const rent = Number(invoiceData.amount_rent || 0);
  const deposit = Number(invoiceData.amount_deposit || 0);
  const tax = Number(invoiceData.amount_tax || Math.round(rent * 0.18));
  const cgst = (tax / 2).toFixed(2);
  const sgst = (tax / 2).toFixed(2);
  const total = Number(invoiceData.amount_total || (rent + deposit + tax));

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
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div 
        id="printable-invoice"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          margin: 'auto'
        }}
      >
        {/* Top Actions (Non-printing bar) */}
        <div className="no-print" style={{
          background: '#f8fafc',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle size={16} /> Payment Verified & Contract Executed
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document */}
        <div style={{ padding: '2rem 2.25rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ background: '#e23744', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#ffffff" />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#e23744', letterSpacing: '-0.02em' }}>
                  RentAI
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                RentAI Technologies Pvt. Ltd.<br />
                Indiranagar 100ft Road, Bangalore, Karnataka - 560038<br />
                <strong>GSTIN:</strong> 29AAACR9482F1Z4 | <strong>SAC:</strong> 9973 (Leasing Services)
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: '#f1f5f9',
                color: '#0f172a',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '0.5rem'
              }}>
                Tax Invoice / Receipt
              </span>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
                {invoiceData.invoice_number || 'INV-2026-RENEWAL'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Date: {formatDate(invoiceData.created_at)}
              </div>
            </div>
          </div>

          {/* Billed To & Transaction Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Billed To
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{invoiceData.user_name || 'Customer'}</strong>
              <div style={{ color: '#64748b', marginTop: '0.2rem' }}>{invoiceData.user_email || 'customer@rentai.com'}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Status: KYC Verified & Approved</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Payment Transaction Details
              </span>
              <div style={{ color: '#0f172a', fontWeight: 600 }}>
                TXN ID: <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{invoiceData.transaction_id || 'TXN_ONLINE_PAID'}</span>
              </div>
              <div style={{ color: '#64748b', marginTop: '0.2rem' }}>
                Method: <strong>{invoiceData.payment_method || 'UPI Gateway'}</strong>
              </div>
              <div style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Status: PAID & CLEARED
              </div>
            </div>
          </div>

          {/* Table of items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem', borderRadius: '6px 0 0 0' }}>Item Description</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Tenure</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Monthly Rent</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Deposit (Refundable)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <strong style={{ color: '#0f172a' }}>{item.rental_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.category_id} • Free Maintenance Included</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {item.tenure} Mos
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>
                    ₹{item.monthly_price}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                    ₹{item.security_deposit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations / Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '280px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#64748b' }}>
                <span>Subtotal (Monthly Rent)</span>
                <span>₹{rent.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#059669' }}>
                <span>Security Deposit (Escrow)</span>
                <span>₹{deposit.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#64748b', fontSize: '0.78rem' }}>
                <span>CGST (9%)</span>
                <span>₹{cgst}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#64748b', fontSize: '0.78rem' }}>
                <span>SGST (9%)</span>
                <span>₹{sgst}</span>
              </div>
              <div style={{ height: '1px', background: '#cbd5e1', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                <span>Total Amount Paid</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Escrow Refund Note */}
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            fontSize: '0.78rem',
            color: '#065f46',
            lineHeight: 1.4,
            marginBottom: '1rem'
          }}>
            <strong>🛡️ Escrow Guarantee & Refund Policy:</strong> The ₹{deposit.toLocaleString('en-IN')} refundable security deposit is held in verified bank escrow. Upon lease completion and physical pickup inspection, 100% of the deposit is automatically credited back to your original payment method.
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
            This is an electronically generated tax invoice for RentAI leasing contracts. No physical signature required.
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceReceiptModal;
