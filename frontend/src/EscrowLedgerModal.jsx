import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  Loader2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';

export default function EscrowLedgerModal({ isOpen, onClose, rental, onDepositSettled }) {
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [settledResult, setSettledResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !rental) return null;

  const app = rental.appliance || {};
  const applianceName = app.rental_name || rental.rental_name || 'Home Appliance';
  const depositAmount = parseFloat(rental.security_deposit || 750);
  const standardDeposit = parseFloat(rental.standard_deposit || Math.round(depositAmount * 2));
  const isDiscounted = rental.deposit_discount_applied || (standardDeposit > depositAmount);
  const escrowId = rental.escrow_id || `ESC-BLR-${String(rental.rental_id || '9842').slice(0, 6).toUpperCase()}`;
  const isHeld = (rental.deposit_status === 'HELD' || !rental.deposit_status) && !settledResult;

  const handleSimulateReturnAndRefund = async () => {
    setIsProcessingRefund(true);
    setErrorMessage('');
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/rentals/', {
        method: 'PATCH',
        body: JSON.stringify({
          rental_id: rental.rental_id,
          action: 'return',
          damage_level: 'NONE',
          late_days: 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettledResult(data);
        if (onDepositSettled) {
          onDepositSettled(data);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || 'Failed to process refund simulation.');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Network error during escrow settlement.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

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
        borderRadius: '1.25rem',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          color: '#ffffff',
          borderTopLeftRadius: '1.25rem',
          borderTopRightRadius: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.625rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#6ee7b7" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                RBI-Compliant Escrow & Deposit Ledger
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '0.15rem' }}>
                Account #{escrowId} • Segregated Trust Protection
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* Appliance info bar */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.875rem',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Protected Asset
              </span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                {applianceName}
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Ledger Status
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: isHeld ? '#059669' : '#0284c7',
                background: isHeld ? '#ecfdf5' : '#f0f9ff',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                border: `1px solid ${isHeld ? '#a7f3d0' : '#bae6fd'}`
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isHeld ? '#10b981' : '#0284c7'
                }} />
                {isHeld ? 'ACTIVE IN ESCROW' : 'SETTLED & REFUNDED'}
              </span>
            </div>
          </div>

          {/* 3 Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.875rem', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>
                LOCKED ESCROW DEPOSIT
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d', margin: '0.25rem 0' }}>
                ₹{depositAmount.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                {isDiscounted ? '💎 KYC 50% Privilege Applied' : '100% Refundable Buffer'}
              </span>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.875rem', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, display: 'block' }}>
                RENTORA SHIELD WAIVER
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1d4ed8', margin: '0.25rem 0' }}>
                ₹10,000
              </div>
              <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>
                ₹0 Penalty for Minor Wear
              </span>
            </div>

            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '0.875rem', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 700, display: 'block' }}>
                SETTLEMENT CHANNEL
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#7e22ce', margin: '0.45rem 0 0.25rem' }}>
                Instant UPI / IMPS
              </div>
              <span style={{ fontSize: '0.72rem', color: '#9333ea' }}>
                T+0 Business Hours Payout
              </span>
            </div>
          </div>

          {/* 4-Stage Escrow Timeline */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.85rem' }}>
              Deposit Custody Lifecycle & Settlement Stepper
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Stage 1 */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#10b981', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  ✓
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>1. Escrow Buffer Established at Checkout</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Secured on {rental.rented_at ? new Date(rental.rented_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Lease Initiation'}. Held in segregated escrow trust account.
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: isHeld ? '#3b82f6' : '#10b981', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  {isHeld ? '2' : '✓'}
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>2. Active Lease Asset Custody & Protection</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Principal balance protected under Rentora Shield. Up to 70% of monthly rents accumulate as equity credit if buyout is chosen.
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: settledResult ? '#10b981' : '#cbd5e1', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  {settledResult ? '✓' : '3'}
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>3. Doorstep Pickup & Technical Inspection</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Senior technician validates functional integrity. Minor cosmetic scuffs, electrical surges, and motor aging are 100% waived.
                  </div>
                </div>
              </div>

              {/* Stage 4 */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: settledResult ? '#10b981' : '#cbd5e1', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                  {settledResult ? '✓' : '4'}
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>4. Instant 100% Escrow Refund to Source Account</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {settledResult ? (
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        Refund Transaction #{settledResult.refund_transaction_id} settled for ₹{settledResult.deposit_refunded}!
                      </span>
                    ) : (
                      'Executed immediately upon handover completion with zero cancellation charges.'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settled Result Success Card */}
          {settledResult && (
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '0.875rem',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={24} color="#059669" />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#065f46', display: 'block' }}>
                  Escrow Deposit Successfully Refunded!
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                  ₹{settledResult.deposit_refunded} credited via UPI (Ref: {settledResult.refund_transaction_id}). Total damage waiver applied: ₹0 deductions.
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {errorMessage}
            </div>
          )}

          {/* Action Trigger for Demo */}
          {isHeld && !settledResult && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                🎓 Live Presentation / Viva Demo Trigger
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', maxWidth: '480px', margin: '0 auto 1rem' }}>
                Demonstrate to the professor how the escrow settlement engine inspects the asset, applies the ₹0 damage waiver, and releases 100% of the deposit balance.
              </div>

              <button
                type="button"
                onClick={handleSimulateReturnAndRefund}
                disabled={isProcessingRefund}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                {isProcessingRefund ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Executing Escrow Settlement...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Simulate Doorstep Pickup & Instant 100% Refund</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          borderBottomLeftRadius: '1.25rem',
          borderBottomRightRadius: '1.25rem'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '0.55rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
