import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home as HomeIcon, Trash2, ArrowRight, Loader2, LogOut, CheckCircle2, ShieldCheck, FileText, Lock } from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import PaymentGatewayModal from './PaymentGatewayModal';
import InvoiceReceiptModal from './InvoiceReceiptModal';

const CartPage = ({ onLogout }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [kycError, setKycError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/cart/');
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (applianceId) => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/cart/', {
        method: 'DELETE',
        body: JSON.stringify({ appliance_id: applianceId })
      });
      if (res.ok) {
        setCartItems(cartItems.filter(item => item.appliance.appliance_id !== applianceId));
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Pre-validate KYC before opening payment gateway
  const handleInitiatePayment = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/kyc/');
      if (res.ok) {
        const kycData = await res.json();
        if (kycData.status !== 'approved') {
          navigate('/kyc');
          return;
        }
      }
      setIsPaymentModalOpen(true);
    } catch (e) {
      console.error("KYC check failed:", e);
      setIsPaymentModalOpen(true); // Fallback to let checkout endpoint enforce
    }
  };

  const handlePaymentSuccess = async (paymentPayload) => {
    setIsPaymentModalOpen(false);
    setCheckingOut(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/checkout/', {
        method: 'POST',
        body: JSON.stringify(paymentPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedPayment(data.payment || {
          transaction_id: data.transaction_id,
          invoice_number: data.invoice_number,
          amount_total: totalDue,
          amount_rent: totalMonthly,
          amount_deposit: totalDeposit,
          amount_tax: totalTax,
          payment_method: paymentPayload.payment_method
        });
        setCheckoutSuccess(true);
        setCartItems([]);
      } else {
        const data = await res.json();
        if (data.requires_kyc) {
          navigate('/kyc');
        } else {
          alert(data.error || "Payment and checkout processing failed");
        }
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    onLogout();
    navigate('/login');
  };

  const getMonthlyRent = (item) => {
    const tenure = item.tenure || "3";
    return item.appliance.pricing ? item.appliance.pricing[tenure] : (item.appliance.monthly_price || Math.round(item.appliance.daily_price * 30));
  };
  
  const getSecurityDeposit = (item) => {
    return item.appliance.security_deposit || Math.round((item.appliance.monthly_price || Math.round(item.appliance.daily_price * 30)) * 1.5);
  };

  const totalMonthly = cartItems.reduce((acc, item) => acc + getMonthlyRent(item), 0);
  const totalDeposit = cartItems.reduce((acc, item) => acc + getSecurityDeposit(item), 0);
  const totalTax = Math.round(totalMonthly * 0.18);
  const totalDue = totalMonthly + totalDeposit + totalTax;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Top Navigation */}
      <nav className="panel" style={{ borderRadius: '0', position: 'sticky', top: 0, zIndex: 50, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon size={22} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>RentAI</h2>
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/rentals" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500 }}>My Rentals</Link>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container animate-fade-in" style={{ padding: '3rem 2rem', maxWidth: '1000px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--secondary-color)' }}>Your Cart</h1>
        
        {checkoutSuccess ? (
          <div className="panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'white', maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: '#dcfce7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 color="#16a34a" size={52} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--secondary-color)', fontWeight: 800 }}>
              Payment & Checkout Successful!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
              Your rental contract has been activated and inventory reserved. Delivery & setup will occur within 24-48 hours.
            </p>

            {completedPayment && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>TRANSACTION ID</span>
                    <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{completedPayment.transaction_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>INVOICE NUMBER</span>
                    <strong style={{ color: '#0f172a' }}>{completedPayment.invoice_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>METHOD</span>
                    <strong style={{ color: '#0f172a' }}>{completedPayment.payment_method || 'UPI/Card'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>AMOUNT PAID</span>
                    <strong style={{ color: '#16a34a', fontSize: '1rem' }}>₹{Number(completedPayment.amount_total || totalDue).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {completedPayment && (
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem' }}
                >
                  <FileText size={18} /> View Tax Invoice
                </button>
              )}
              <Link to="/rentals" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', padding: '0.75rem 1.5rem' }}>
                Go to My Rentals <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '2rem' }}>Your cart is empty.</p>
            <Link to="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Browse Catalog</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cartItems.map(item => (
                <div key={item.cart_item_id} className="panel" style={{ display: 'flex', padding: '1.5rem', background: 'white', gap: '1.5rem' }}>
                  <div style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <img 
                      src={item.appliance.image_url} 
                      alt={item.appliance.rental_name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 style={{ fontSize: '1.25rem', color: 'var(--secondary-color)', marginBottom: '0.25rem' }}>{item.appliance.rental_name}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{item.appliance.category_id}</p>
                        </div>
                        <span className="badge badge-secondary">{item.tenure || "3"} Months Plan</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Monthly Rent</div>
                          <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>₹{getMonthlyRent(item)}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Refundable Deposit</div>
                          <span style={{ fontWeight: '500', fontSize: '1rem', color: 'var(--text-secondary)' }}>₹{getSecurityDeposit(item)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.appliance.appliance_id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="panel" style={{ flex: '1 1 300px', padding: '2rem', background: 'white', position: 'sticky', top: '6rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--secondary-color)' }}>Order Summary</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Monthly Rent ({cartItems.length} items)</span>
                <span>₹{totalMonthly.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', color: '#059669', fontSize: '0.9rem' }}>
                <span>Security Deposit (Refundable)</span>
                <span>₹{totalDeposit.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>GST (18% on rent)</span>
                <span>₹{totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Delivery & Assembly</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Free</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '800' }}>
                <span>Total Due Today</span>
                <span>₹{totalDue.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.75rem', color: '#065f46', marginBottom: '1.5rem' }}>
                🛡️ <strong>Escrow Protected:</strong> ₹{totalDeposit.toLocaleString('en-IN')} deposit will be 100% refunded when you return appliances.
              </div>

              <button 
                onClick={handleInitiatePayment}
                disabled={checkingOut}
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
              >
                {checkingOut ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <Lock size={18} /> Proceed to Pay ₹{totalDue.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalDue}
        rentAmount={totalMonthly}
        depositAmount={totalDeposit}
        taxAmount={totalTax}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={completedPayment}
      />
    </div>
  );
};

export default CartPage;
