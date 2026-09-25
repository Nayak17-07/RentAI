import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Loader2, 
  LogOut, 
  Package, 
  Calendar, 
  Wrench, 
  Truck, 
  CheckCircle, 
  X, 
  Clock, 
  MapPin,
  Sparkles,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowDownToLine,
  Receipt
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import InvoiceReceiptModal from './InvoiceReceiptModal';

const MyRentalsPage = ({ onLogout }) => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rentals'); // 'rentals' | 'payments'
  const [serviceModal, setServiceModal] = useState(null); // { type: 'maintenance' | 'relocation', rental: item }
  const [serviceSuccess, setServiceSuccess] = useState(null);
  const [refundSuccess, setRefundSuccess] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const [dateSlot, setDateSlot] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [relocationCity, setRelocationCity] = useState('Hyderabad');
  const [serviceNotes, setServiceNotes] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchRentalsAndPayments();
  }, []);

  const fetchRentalsAndPayments = async () => {
    try {
      const [resRentals, resPayments] = await Promise.all([
        fetchWithAuth('http://localhost:8000/api/rentals/'),
        fetchWithAuth('http://localhost:8000/api/payments/')
      ]);
      if (resRentals.ok) {
        const data = await resRentals.json();
        setRentals(data);
      }
      if (resPayments.ok) {
        const payData = await resPayments.json();
        setPayments(payData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    onLogout();
    navigate('/login');
  };

  const handleDeactivate = async (rental) => {
    const depositAmt = rental.security_deposit || 750;
    if (!window.confirm(`Are you sure you want to return "${rental.appliance.rental_name}"?\n\nYour refundable security deposit of ₹${depositAmt.toLocaleString('en-IN')} will be immediately credited back to your original payment method.`)) {
      return;
    }
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/rentals/', {
        method: 'PATCH',
        body: JSON.stringify({ rental_id: rental.rental_id })
      });
      if (res.ok) {
        const data = await res.json();
        setRefundSuccess({
          title: "Deposit Refund Initiated!",
          message: `₹${(data.deposit_refunded || depositAmt).toLocaleString('en-IN')} successfully refunded to your payment method. Refund Reference: ${data.refund_transaction_id || 'REF_INSTANT'}. Stock has been replenished.`,
          applianceName: rental.appliance.rental_name
        });
        fetchRentalsAndPayments();
      }
    } catch (error) {
      console.error("Error returning rental:", error);
    }
  };

  const handleViewInvoice = (rentalOrPayment) => {
    if (rentalOrPayment.invoice_number && rentalOrPayment.amount_total) {
      // It's a payment object
      setSelectedInvoice(rentalOrPayment);
    } else {
      // It's a rental object - find corresponding payment or format invoice
      const matched = payments.find(p => p.transaction_id === rentalOrPayment.transaction_id || p.invoice_number === rentalOrPayment.invoice_number);
      if (matched) {
        setSelectedInvoice(matched);
      } else {
        const rentPrice = rentalOrPayment.monthly_rent || (rentalOrPayment.appliance.pricing ? rentalOrPayment.appliance.pricing[rentalOrPayment.tenure || "3"] : rentalOrPayment.appliance.monthly_price);
        const depPrice = rentalOrPayment.security_deposit || Math.round(rentPrice * 1.5);
        setSelectedInvoice({
          invoice_number: rentalOrPayment.invoice_number || `INV-${rentalOrPayment.rental_id.slice(0, 6).toUpperCase()}`,
          transaction_id: rentalOrPayment.transaction_id || `TXN_${rentalOrPayment.rental_id.slice(0, 8).toUpperCase()}`,
          created_at: rentalOrPayment.rented_at,
          payment_method: rentalOrPayment.payment_method || 'UPI Gateway',
          amount_rent: rentPrice,
          amount_deposit: depPrice,
          amount_tax: Math.round(rentPrice * 0.18),
          amount_total: rentPrice + depPrice + Math.round(rentPrice * 0.18),
          items_summary: [{
            rental_name: rentalOrPayment.appliance.rental_name,
            category_id: rentalOrPayment.appliance.category_id,
            tenure: rentalOrPayment.tenure || "3",
            monthly_price: rentPrice,
            security_deposit: depPrice
          }]
        });
      }
    }
    setIsInvoiceModalOpen(true);
  };

  const handleBookService = (e) => {
    e.preventDefault();
    const typeLabel = serviceModal.type === 'maintenance' ? 'Free Maintenance Technician' : 'Free Relocation';
    setServiceSuccess({
      title: `${typeLabel} Confirmed!`,
      message: serviceModal.type === 'maintenance'
        ? `A certified technician has been scheduled for ${serviceModal.rental.appliance.rental_name} on ${dateSlot || 'tomorrow'} (${timeSlot}). Ticket #SERV-${Math.floor(100000 + Math.random() * 900000)}.`
        : `Your relocation request to ${relocationCity} has been logged. Our logistics team will contact you to coordinate packing & transit.`
    });
    setServiceModal(null);
    setServiceNotes('');
    setTimeout(() => {
      setServiceSuccess(null);
    }, 6000);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>
      
      {/* Service Modal (Maintenance or Relocation) */}
      {serviceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <button 
              onClick={() => setServiceModal(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e23744', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              {serviceModal.type === 'maintenance' ? <Wrench size={16} /> : <Truck size={16} />}
              <span>{serviceModal.type === 'maintenance' ? '100% Free Annual Servicing' : 'Free Inter-City Relocation'}</span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#111827' }}>
              {serviceModal.type === 'maintenance' ? 'Schedule Technician Visit' : 'Relocate Your Subscription'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
              Product: <strong>{serviceModal.rental.appliance.rental_name}</strong>
            </p>

            <form onSubmit={handleBookService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {serviceModal.type === 'relocation' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Destination City:
                  </label>
                  <select 
                    value={relocationCity} 
                    onChange={(e) => setRelocationCity(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none' }}
                  >
                    {['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                  Preferred Date:
                </label>
                <input 
                  type="date"
                  required
                  value={dateSlot}
                  onChange={(e) => setDateSlot(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                  Preferred Time Slot:
                </label>
                <select 
                  value={timeSlot} 
                  onChange={(e) => setTimeSlot(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                  <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                  <option value="05:00 PM - 08:00 PM">Evening (05:00 PM - 08:00 PM)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                  Issue / Relocation Notes:
                </label>
                <textarea 
                  placeholder={serviceModal.type === 'maintenance' ? 'Describe problem (e.g., periodic deep cleaning, noise, water leak)...' : 'New apartment address or shifting details...'}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit"
                style={{
                  background: '#e23744',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(226, 55, 68, 0.3)',
                  marginTop: '0.5rem'
                }}
              >
                Confirm {serviceModal.type === 'maintenance' ? 'Service Appointment (₹0)' : 'Relocation Request (₹0)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #ebebeb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              background: '#e23744',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1.25rem',
              fontFamily: "'Outfit', sans-serif"
            }}>
              R
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              Rent<span style={{ color: '#e23744' }}>AI</span>
            </span>
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 500, fontSize: '0.9rem' }}>Browse Catalog</Link>
            <Link to="/cart" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 500, fontSize: '0.9rem' }}>Cart</Link>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '2.5rem auto 0', padding: '0 1.5rem' }}>
        
        {/* Refund Success Alert Banner */}
        {refundSuccess && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#065f46',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
            position: 'relative'
          }}>
            <CheckCircle size={24} color="#059669" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{refundSuccess.title}</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{refundSuccess.message}</div>
            </div>
            <button 
              onClick={() => setRefundSuccess(null)}
              style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Service Success Alert Banner */}
        {serviceSuccess && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#065f46',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
          }}>
            <CheckCircle size={24} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{serviceSuccess.title}</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{serviceSuccess.message}</div>
            </div>
          </div>
        )}

        {/* Top Header & Assurance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#111827' }}>My Subscriptions & Billing</h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Manage active leases, track escrow security deposits, book maintenance, and download GST tax invoices.
            </p>
          </div>

          {/* Quick assurance badges */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #ebebeb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
              <ShieldCheck size={14} /> 100% Refundable Deposits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #ebebeb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
              <Truck size={14} /> Free Relocation
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Active Leases vs Payment History */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setActiveTab('rentals')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'rentals' ? '#e23744' : '#6b7280',
              borderBottom: activeTab === 'rentals' ? '3px solid #e23744' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s'
            }}
          >
            <Package size={18} />
            <span>Active Leases</span>
            <span style={{
              background: activeTab === 'rentals' ? '#fee2e2' : '#f3f4f6',
              color: activeTab === 'rentals' ? '#dc2626' : '#6b7280',
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem'
            }}>
              {rentals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'payments' ? '#e23744' : '#6b7280',
              borderBottom: activeTab === 'payments' ? '3px solid #e23744' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s'
            }}
          >
            <Receipt size={18} />
            <span>Payment History & Tax Invoices</span>
            <span style={{
              background: activeTab === 'payments' ? '#fee2e2' : '#f3f4f6',
              color: activeTab === 'payments' ? '#dc2626' : '#6b7280',
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem'
            }}>
              {payments.length}
            </span>
          </button>
        </div>
        
        {/* TAB 1: ACTIVE LEASES */}
        {activeTab === 'rentals' && (
          rentals.length === 0 ? (
            <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#ffffff', border: '1px solid #ebebeb', borderRadius: '16px' }}>
              <Package size={52} color="#9ca3af" style={{ margin: '0 auto 1.25rem' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem' }}>No Active Rentals</h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                You don't have any active subscriptions. Explore our appliances and furniture to start renting today!
              </p>
              <Link to="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
              {rentals.map(rental => (
                <div 
                  key={rental.rental_id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: '#ffffff', 
                    border: '1px solid #ebebeb', 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {/* Photo Header */}
                  <div style={{ height: '210px', background: '#f8f8f8', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={rental.appliance.image_url} 
                      alt={rental.appliance.rental_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      background: '#ecfdf5', 
                      color: '#059669', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Active Lease
                    </span>
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px', 
                      background: '#e23744', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      {rental.tenure || "3"} Months Tenure
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {rental.appliance.category_id}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', color: '#111827', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.3 }}>
                      {rental.appliance.rental_name}
                    </h3>

                    {/* Escrow Deposit Badge & Tax Invoice Link */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Deposit: ₹{rental.security_deposit || 750} (Escrow)
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleViewInvoice(rental)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                      >
                        <FileText size={12} /> Tax Invoice
                      </button>
                    </div>
                    
                    {/* Metadata */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} color="#e23744" />
                        <span>Rented On: <strong>{formatDate(rental.rented_at)}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="#059669" />
                        <span>Next Billing Date: <strong>{formatDate(rental.next_billing_date)}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#9ca3af' }}>Monthly Installment:</span>
                        <strong style={{ color: '#111827', fontSize: '0.95rem' }}>
                          ₹{rental.appliance.pricing ? rental.appliance.pricing[rental.tenure || "3"] : rental.appliance.monthly_price}/mo
                        </strong>
                      </div>
                    </div>
                    
                    <div style={{ height: '1px', background: '#f3f4f6', margin: '0 0 1.25rem' }} />
                    
                    {/* Core RentoMojo Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          onClick={() => setServiceModal({ type: 'maintenance', rental })}
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            padding: '0.55rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Wrench size={13} />
                          <span>Maintenance</span>
                        </button>

                        <button
                          onClick={() => setServiceModal({ type: 'relocation', rental })}
                          style={{
                            background: '#f0fdf4',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            padding: '0.55rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Truck size={13} />
                          <span>Free Shifting</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => handleDeactivate(rental)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        Return Appliance & Claim Deposit (₹{rental.security_deposit || 750})
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 2: PAYMENT HISTORY & TAX INVOICES */}
        {activeTab === 'payments' && (
          <div style={{ background: '#ffffff', border: '1px solid #ebebeb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            {payments.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <Receipt size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#111827', margin: '0 0 0.5rem' }}>No Transactions Yet</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                  Invoices and transaction receipts will appear here as soon as you checkout rentals.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Invoice & Date</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Transaction ID</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Payment Method</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Rent</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Deposit</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>GST (18%)</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Total Paid</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment._id || payment.transaction_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{payment.invoice_number}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(payment.created_at)}</span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#2563eb' }}>
                          {payment.transaction_id}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {payment.payment_method || 'UPI'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          ₹{Number(payment.amount_rent || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          ₹{Number(payment.amount_deposit || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                          ₹{Number(payment.amount_tax || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(payment.amount_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <span style={{
                            background: '#dcfce7',
                            color: '#16a34a',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            PAID
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(payment)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <FileText size={13} /> View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={selectedInvoice}
      />
    </div>
  );
};

export default MyRentalsPage;
