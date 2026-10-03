import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Sparkles, 
  ArrowRight,
  QrCode,
  AlertCircle,
  Banknote,
  Truck
} from 'lucide-react';

const PaymentGatewayModal = ({ isOpen, onClose, totalAmount, rentAmount, depositAmount, taxAmount, onPaymentSuccess }) => {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [stage, setStage] = useState('input'); // 'input' | 'processing' | 'success'
  const [statusMessage, setStatusMessage] = useState('');
  
  // UPI Form state
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [qrCountdown, setQrCountdown] = useState(180);

  // Card Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState('');

  // NetBanking state
  const [selectedBank, setSelectedBank] = useState('HDFC');

  const popularBanks = [
    { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', icon: '🏛️', color: '#004c8f' },
    { id: 'SBI', name: 'State Bank of India', code: 'SBI', icon: '🏦', color: '#280071' },
    { id: 'ICICI', name: 'ICICI Bank', code: 'ICICI', icon: '🏢', color: '#b02a30' },
    { id: 'AXIS', name: 'Axis Bank', code: 'AXIS', icon: '🏬', color: '#97144d' },
    { id: 'KOTAK', name: 'Kotak Mahindra', code: 'KOTAK', icon: '🏦', color: '#ed1c24' },
    { id: 'PNB', name: 'Punjab National Bank', code: 'PNB', icon: '🏛️', color: '#a20a3a' },
  ];

  // Timer for QR code
  useEffect(() => {
    let timer;
    if (isOpen && activeTab === 'upi' && stage === 'input' && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, activeTab, stage, qrCountdown]);

  if (!isOpen) return null;

  const formatCardNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const getCardNetwork = () => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('6') || clean.startsWith('3')) return 'RuPay';
    return 'Card';
  };

  const triggerPaymentProcess = (paymentMethod, paymentDetails) => {
    setStage('processing');
    setStatusMessage('Initiating 256-bit encrypted handshake...');

    setTimeout(() => {
      setStatusMessage('Authenticating with Banking Gateway Node...');
    }, 900);

    setTimeout(() => {
      setStatusMessage('Verifying 3D-Secure e-Mandate...');
    }, 1800);

    setTimeout(() => {
      setStage('success');
      setStatusMessage('Payment Authorized & Verified!');
      
      setTimeout(() => {
        onPaymentSuccess({
          payment_method: paymentMethod,
          payment_details: paymentDetails
        });
      }, 1400);
    }, 2800);
  };

  const handleUpiPay = (e) => {
    e?.preventDefault();
    if (!upiId.trim() || !upiId.includes('@')) {
      setUpiError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or phone@upi)');
      return;
    }
    setUpiError('');
    triggerPaymentProcess('UPI', { upi_id: upiId.trim(), type: 'UPI_COLLECT' });
  };

  const handleSimulatedScanPay = () => {
    triggerPaymentProcess('UPI_QR', { upi_id: 'instant_qr_scan@rentora', type: 'UPI_QR_AUTO' });
  };

  const handleCardPay = (e) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setCardError('Enter valid expiry (MM/YY).');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setCardError('Enter valid 3-digit CVV.');
      return;
    }
    setCardError('');
    triggerPaymentProcess('CARD', {
      card_last4: cleanNum.slice(-4),
      card_network: getCardNetwork(),
      holder_name: cardHolder || 'Authorized Customer'
    });
  };

  const handleNetBankingPay = () => {
    const bank = popularBanks.find(b => b.id === selectedBank) || popularBanks[0];
    triggerPaymentProcess('NETBANKING', {
      bank_code: bank.code,
      bank_name: bank.name
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '720px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #e23744 0%, #ff5e62 100%)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(226, 55, 68, 0.4)'
            }}>
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Rentora Secure Gateway
                </h3>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Lock size={10} /> 256-Bit SSL
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Verified Escrow & Real-Time Lease Authorization
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Payable
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
                ₹{Number(totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
            {stage === 'input' && (
              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Amount Breakdown Mini Banner */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.65rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>
            <span>1st Month Rent: <strong>₹{rentAmount}</strong></span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>Security Deposit (Refundable): <strong style={{ color: '#059669' }}>₹{depositAmount}</strong></span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>GST (18%): <strong>₹{taxAmount}</strong></span>
          </div>
          <div style={{ color: '#059669', fontWeight: 600 }}>
            Delivery & Installation Free
          </div>
        </div>

        {/* Modal Body */}
        {stage === 'processing' ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '4px solid #f1f5f9',
                borderTopColor: '#e23744',
                animation: 'spin 1s linear infinite'
              }} />
              <ShieldCheck size={36} color="#e23744" style={{ position: 'absolute', top: '22px', left: '22px' }} />
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Processing Transaction
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '360px', margin: '0 0 1rem' }}>
              {statusMessage}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Please do not close or refresh this tab.
            </span>
          </div>
        ) : stage === 'success' ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={48} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Payment Verified!
            </h3>
            <p style={{ color: '#16a34a', fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem' }}>
              ₹{Number(totalAmount).toLocaleString('en-IN')} Authorized Successfully
            </p>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Finalizing active lease contracts and generating tax invoice...
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', minHeight: '380px' }}>
            
            {/* Sidebar Method Selector */}
            <div style={{
              width: '210px',
              background: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <button
                onClick={() => setActiveTab('upi')}
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: activeTab === 'upi' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'upi' ? '4px solid #e23744' : '4px solid transparent',
                  fontWeight: activeTab === 'upi' ? 700 : 500,
                  color: activeTab === 'upi' ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <Smartphone size={18} color={activeTab === 'upi' ? '#e23744' : '#64748b'} />
                <div>
                  <div style={{ fontSize: '0.9rem' }}>UPI / QR</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>GPay, PhonePe, Paytm</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('card')}
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: activeTab === 'card' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'card' ? '4px solid #e23744' : '4px solid transparent',
                  fontWeight: activeTab === 'card' ? 700 : 500,
                  color: activeTab === 'card' ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <CreditCard size={18} color={activeTab === 'card' ? '#e23744' : '#64748b'} />
                <div>
                  <div style={{ fontSize: '0.9rem' }}>Cards</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Credit & Debit Cards</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('netbanking')}
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: activeTab === 'netbanking' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'netbanking' ? '4px solid #e23744' : '4px solid transparent',
                  fontWeight: activeTab === 'netbanking' ? 700 : 500,
                  color: activeTab === 'netbanking' ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <Building2 size={18} color={activeTab === 'netbanking' ? '#e23744' : '#64748b'} />
                <div>
                  <div style={{ fontSize: '0.9rem' }}>Net Banking</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>All Major Indian Banks</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('cod')}
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: activeTab === 'cod' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === 'cod' ? '4px solid #16a34a' : '4px solid transparent',
                  fontWeight: activeTab === 'cod' ? 700 : 500,
                  color: activeTab === 'cod' ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <Truck size={18} color={activeTab === 'cod' ? '#16a34a' : '#64748b'} />
                <div>
                  <div style={{ fontSize: '0.9rem' }}>Pay on Delivery</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Cash / UPI on Doorstep</div>
                </div>
              </button>

              <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.7rem', color: '#94a3b8' }}>
                ⚡ Auto-debit e-mandates supported for monthly rental renewals
              </div>
            </div>

            {/* Main Tab Panel */}
            <div style={{ flex: 1, padding: '1.75rem 2rem', background: '#ffffff', overflowY: 'auto' }}>
              
              {/* TAB 1: UPI */}
              {activeTab === 'upi' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                      Scan QR or Enter UPI ID
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      QR expires in: {Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1.5rem'
                  }}>
                    {/* SVG QR Code Simulation */}
                    <div style={{
                      background: '#ffffff',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      <svg width="110" height="110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white"/>
                        <path d="M10 10h30v30h-30zM60 10h30v30h-30zM10 60h30v30h-30z" fill="#0f172a"/>
                        <rect x="18" y="18" width="14" height="14" fill="white"/>
                        <rect x="68" y="18" width="14" height="14" fill="white"/>
                        <rect x="18" y="68" width="14" height="14" fill="white"/>
                        <rect x="22" y="22" width="6" height="6" fill="#e23744"/>
                        <rect x="72" y="22" width="6" height="6" fill="#e23744"/>
                        <rect x="22" y="72" width="6" height="6" fill="#e23744"/>
                        <path d="M45 10h5v10h-5zM50 25h10v5h-10zM45 45h10v10h-10zM60 45h5v20h-5zM75 50h15v5h-15zM70 65h10v10h-10zM85 70h5v20h-5zM50 75h10v15h-10zM60 85h15v5h-15zM10 45h15v5h-15zM30 45h10v5h-10z" fill="#0f172a"/>
                      </svg>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#e23744', marginTop: '0.25rem' }}>
                        Rentora UPI
                      </span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Scan with Any App</span>
                      </div>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                        Open Google Pay, PhonePe, Paytm, or BHIM and point camera at QR code.
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulatedScanPay}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 0.9rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                        }}
                      >
                        <Sparkles size={14} /> Simulate QR Scan & Pay
                      </button>
                    </div>
                  </div>

                  {/* Manual UPI ID */}
                  <form onSubmit={handleUpiPay}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Or Enter UPI ID / VPA
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="username@okhdfcbank or 9876543210@paytm"
                        value={upiId}
                        onChange={(e) => { setUpiId(e.target.value); setUpiError(''); }}
                        style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: upiError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '0 1.25rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                      >
                        Verify & Pay <ArrowRight size={16} />
                      </button>
                    </div>
                    {upiError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.75rem' }}>
                        <AlertCircle size={14} /> {upiError}
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* TAB 2: CREDIT / DEBIT CARD */}
              {activeTab === 'card' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                      Card Details
                    </h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e23744', background: '#fef2f2', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                      {getCardNetwork()}
                    </span>
                  </div>

                  <form onSubmit={handleCardPay}>
                    {/* Visual Card Preview */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      color: '#ffffff',
                      marginBottom: '1.25rem',
                      boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: '36px', height: '26px', background: '#fbbf24', borderRadius: '4px', opacity: 0.8 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em' }}>{getCardNetwork()}</span>
                      </div>
                      <div style={{ fontSize: '1.15rem', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: '1rem', color: '#f8fafc' }}>
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.65rem' }}>CARD HOLDER</span>
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{cardHolder.toUpperCase() || 'YOUR NAME'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.65rem' }}>EXPIRES</span>
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{cardExpiry || 'MM/YY'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4532 8900 1234 5678"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Name on Card
                        </label>
                        <input
                          type="text"
                          placeholder="Arjun Verma"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          Expiry
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                          CVV
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>

                    {cardError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        <AlertCircle size={14} /> {cardError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                    >
                      Authorize & Pay ₹{Number(totalAmount).toLocaleString('en-IN')}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: NET BANKING */}
              {activeTab === 'netbanking' && (
                <div>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                    Select Your Bank
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {popularBanks.map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        style={{
                          padding: '0.85rem 0.5rem',
                          borderRadius: '10px',
                          border: selectedBank === bank.id ? '2px solid #e23744' : '1px solid #e2e8f0',
                          background: selectedBank === bank.id ? '#fef2f2' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{bank.icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedBank === bank.id ? '#e23744' : '#334155', textAlign: 'center' }}>
                          {bank.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    ℹ️ You will be redirected to your bank's secure net-banking portal to authorize this lease agreement.
                  </div>

                  <button
                    type="button"
                    onClick={handleNetBankingPay}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                  >
                    Proceed with {popularBanks.find(b => b.id === selectedBank)?.name} (₹{Number(totalAmount).toLocaleString('en-IN')})
                  </button>
                </div>
              )}

              {/* TAB 4: CASH ON DELIVERY / DOORSTEP */}
              {activeTab === 'cod' && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                      Pay upon Doorstep Handover
                    </h4>
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      Zero Online Charge Today
                    </span>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      How Doorstep Rental Payment Works
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <li><strong>Physical Inspection First:</strong> You inspect the appliance condition during delivery before paying anything.</li>
                      <li><strong>Pay Delivery Partner:</strong> Handover 1st month rent + refundable deposit via <strong>UPI QR, Cash, or POS Card</strong> to our field technician.</li>
                      <li><strong>Instant Contract Activation:</strong> Once verified, your active lease and GST tax receipt are instantly logged to your Rentora dashboard.</li>
                    </ul>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: '#64748b' }}>Due upon delivery:</span>
                      <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>₹{Number(totalAmount).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Includes 1st Month Rent (₹{Number(rentAmount).toLocaleString('en-IN')}) + Refundable Escrow Deposit (₹{Number(depositAmount).toLocaleString('en-IN')}) + 18% GST.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerPaymentProcess('CASH_ON_DELIVERY', { type: 'COD_DOORSTEP' })}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', background: '#16a34a', borderColor: '#16a34a' }}
                  >
                    Confirm Order with Cash on Delivery (₹{Number(totalAmount).toLocaleString('en-IN')})
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div style={{
          background: '#f1f5f9',
          padding: '0.75rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748b',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={12} color="#059669" />
            <span>End-to-End RBI Compliant Payment Gateway</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Instant Confirmation</span>
            <span>GST Invoice Included</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentGatewayModal;
