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
  Receipt,
  RefreshCw,
  AlertTriangle,
  Star,
  MessageSquare,
  ShieldAlert,
  Award,
  Zap,
  Wifi,
  Download
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import { getSocket, joinUserRoom } from './utils/socket';
import { downloadCsv } from './utils/exportCsv';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import ExperienceSwapModal from './ExperienceSwapModal';
import ThemeToggle from './ThemeToggle';
import DeliveryTrackerModal from './DeliveryTrackerModal';
import RentToOwnModal from './RentToOwnModal';
import OwnershipCertificateModal from './OwnershipCertificateModal';

const MyRentalsPage = ({ onLogout }) => {
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rentals'); // 'rentals' | 'payments' | 'complaints'
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);
  const [serviceModal, setServiceModal] = useState(null); // { type: 'maintenance' | 'relocation', rental: item }
  const [serviceSuccess, setServiceSuccess] = useState(null);
  const [refundSuccess, setRefundSuccess] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [trackingModalRental, setTrackingModalRental] = useState(null);
  
  // Return & Damage Assessment State (Module 6)
  const [returnModalRental, setReturnModalRental] = useState(null);
  const [damageLevel, setDamageLevel] = useState('NONE'); // NONE | MINOR | MODERATE | SEVERE
  const [damageNotes, setDamageNotes] = useState('');
  const [lateDays, setLateDays] = useState(0);
  const [returningLoading, setReturningLoading] = useState(false);

  // Complaints & Grievance State (Module 8)
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('Appliance Quality');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const [dateSlot, setDateSlot] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [relocationCity, setRelocationCity] = useState('Hyderabad');
  const [serviceNotes, setServiceNotes] = useState('');
  const [swapModalRental, setSwapModalRental] = useState(null);

  // Rent-to-Own & Tenure Extension State (Module Upgrade)
  const [buyoutModalRental, setBuyoutModalRental] = useState(null);
  const [certificateModalRental, setCertificateModalRental] = useState(null);
  const [buyoutSuccessAlert, setBuyoutSuccessAlert] = useState(null);
  const [tenureSuccessAlert, setTenureSuccessAlert] = useState(null);

  // Monthly Recurring Billing State
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [payingBillLoading, setPayingBillLoading] = useState(false);
  const [billPaySuccess, setBillPaySuccess] = useState(null);

  const navigate = useNavigate();

  const fetchRentalsAndPayments = async () => {
    try {
      const [resRentals, resPayments, resCatalog, resComplaints] = await Promise.all([
        fetchWithAuth('http://localhost:8000/api/rentals/'),
        fetchWithAuth('http://localhost:8000/api/payments/'),
        fetch('http://localhost:8000/api/appliances/'),
        fetchWithAuth('http://localhost:8000/api/complaints/')
      ]);
      if (resRentals.ok) {
        const data = await resRentals.json();
        setRentals(data);
      }
      if (resPayments.ok) {
        const payData = await resPayments.json();
        setPayments(payData);
      }
      if (resCatalog.ok) {
        const catData = await resCatalog.json();
        setCatalog(catData);
      }
      if (resComplaints && resComplaints.ok) {
        const compData = await resComplaints.json();
        setComplaints(compData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalsAndPayments();

    const socket = getSocket();
    const userInfoStr = localStorage.getItem('user');
    let userId = null;
    try {
      if (userInfoStr) userId = JSON.parse(userInfoStr).id || JSON.parse(userInfoStr)._id;
    } catch (e) {}

    joinUserRoom(userId);

    if (socket) {
      setSocketConnected(socket.connected);
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);

      const onDeliveryUpdated = (data) => {
        setLiveNotification({
          type: 'delivery',
          title: '🚚 Live Fleet Delivery Update',
          message: `Your rental ${data.rental_id ? `#${String(data.rental_id).slice(-6)}` : ''} dispatch status updated to "${(data.delivery_status || data.status || 'IN_TRANSIT').replace('_', ' ')}"`,
          timestamp: new Date().toLocaleTimeString()
        });
        fetchRentalsAndPayments();
        setTrackingModalRental((prev) => {
          if (prev && (prev._id === data.rental_id || prev.rental_id === data.rental_id)) {
            return { ...prev, delivery_status: data.delivery_status || data.status };
          }
          return prev;
        });
      };

      const onKycStatusUpdate = (data) => {
        setLiveNotification({
          type: 'kyc',
          title: '🛡️ KYC Verification Update',
          message: `Your identity verification status has been updated to "${data.status}" by compliance moderation.`,
          timestamp: new Date().toLocaleTimeString()
        });
        fetchRentalsAndPayments();
      };

      const onOrderNew = () => {
        fetchRentalsAndPayments();
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('delivery:updated', onDeliveryUpdated);
      socket.on('kyc:status_update', onKycStatusUpdate);
      socket.on('order:new', onOrderNew);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('delivery:updated', onDeliveryUpdated);
        socket.off('kyc:status_update', onKycStatusUpdate);
        socket.off('order:new', onOrderNew);
      };
    }
  }, []);

  useEffect(() => {
    if (liveNotification) {
      const timer = setTimeout(() => setLiveNotification(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [liveNotification]);

  const handleExportCustomerData = () => {
    if (activeTab === 'payments') {
      const headers = [
        { key: '_id', label: 'Payment ID' },
        { key: 'amount', label: 'Amount Paid (₹)' },
        { key: 'payment_type', label: 'Payment Purpose' },
        { key: 'payment_method', label: 'Payment Method' },
        { key: 'status', label: 'Transaction Status' },
        { key: 'created_at', label: 'Timestamp' }
      ];
      downloadCsv(`Rentora_Payment_History_${new Date().toISOString().split('T')[0]}`, headers, payments);
    } else {
      const headers = [
        { key: '_id', label: 'Subscription ID' },
        { key: 'appliance_name', label: 'Appliance Model' },
        { key: 'category_id', label: 'Category' },
        { key: 'monthly_price', label: 'Monthly Rent (₹)' },
        { key: 'security_deposit', label: 'Escrow Deposit (₹)' },
        { key: 'tenure', label: 'Tenure (Months)' },
        { key: 'status', label: 'Lease Status' },
        { key: 'delivery_status', label: 'Logistics State' },
        { key: 'rented_at', label: 'Start Date' }
      ];
      const rows = rentals.map(r => ({
        _id: r._id || r.rental_id,
        appliance_name: r.appliance?.rental_name || 'Appliance',
        category_id: r.appliance?.category_id || 'Appliances',
        monthly_price: r.monthly_price || r.appliance?.monthly_price,
        security_deposit: r.security_deposit || r.appliance?.security_deposit,
        tenure: r.tenure,
        status: r.status,
        delivery_status: r.delivery_status || 'DELIVERED',
        rented_at: r.rented_at
      }));
      downloadCsv(`Rentora_Subscriptions_${new Date().toISOString().split('T')[0]}`, headers, rows);
    }
  };

  const handlePayMonthlyBill = async (amount) => {
    setPayingBillLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/payments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          payment_type: 'MONTHLY_RENT',
          payment_method: 'UPI',
          status: 'SUCCESS'
        })
      });
      setBillPaySuccess({
        amount: amount,
        date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      fetchRentalsAndPayments();
      setTimeout(() => setBillPaySuccess(null), 8000);
    } catch (e) {
      setBillPaySuccess({
        amount: amount,
        date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      setTimeout(() => setBillPaySuccess(null), 8000);
    } finally {
      setPayingBillLoading(false);
    }
  };

  const handleBuyoutSuccess = (updatedRental) => {
    setBuyoutModalRental(null);
    setCertificateModalRental(updatedRental);
    setBuyoutSuccessAlert({
      title: "Permanent Ownership Transferred Successfully! 💎",
      message: `You now own ${updatedRental.appliance?.rental_name || 'your appliance'} with zero future rent! Official title deed and certificate generated.`,
      rental: updatedRental
    });
    fetchRentalsAndPayments();
  };

  const handleTenureExtended = (data) => {
    setBuyoutModalRental(null);
    setTenureSuccessAlert({
      title: "Tenure Extended Successfully! ⚡",
      message: data.success || "Your monthly subscription rate has been discounted."
    });
    setTimeout(() => setTenureSuccessAlert(null), 5000);
    fetchRentalsAndPayments();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    onLogout();
    navigate('/login');
  };

  const handleOpenReturnModal = (rental) => {
    setReturnModalRental(rental);
    setDamageLevel('NONE');
    setDamageNotes('');
    setLateDays(0);
  };

  const handleConfirmReturnAssessment = async () => {
    if (!returnModalRental) return;
    setReturningLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/rentals/', {
        method: 'PATCH',
        body: JSON.stringify({
          rental_id: returnModalRental.rental_id,
          damage_level: damageLevel,
          damage_description: damageNotes,
          late_days: Number(lateDays) || 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        const refundAmt = data.deposit_refunded !== undefined ? data.deposit_refunded : (returnModalRental.security_deposit || 750);
        setRefundSuccess({
          title: "Return Processed & Deposit Refund Initiated!",
          message: `₹${refundAmt.toLocaleString('en-IN')} credited back to your original payment method. Refund Reference: ${data.refund_transaction_id || 'REF_INSTANT'}. ${data.waiver_applied ? '🛡️ Rentora ₹10,000 Damage Waiver applied successfully (₹0 damage fee deducted).' : ''} Stock replenished.`,
          applianceName: returnModalRental.appliance?.rental_name || 'Appliance'
        });
        setReturnModalRental(null);
        fetchRentalsAndPayments();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to process return. Please try again.");
      }
    } catch (err) {
      console.error("Error returning rental:", err);
      alert("Network error processing return. Please check your connection.");
    } finally {
      setReturningLoading(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setComplaintSubmitting(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/complaints/', {
        method: 'POST',
        body: JSON.stringify({
          subject: complaintSubject,
          category: complaintCategory,
          description: complaintDesc
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Grievance Ticket ${data.complaint.ticket_id} submitted! Support team will reach out within 2 hours.`);
        setIsComplaintModalOpen(false);
        setComplaintSubject('');
        setComplaintDesc('');
        fetchRentalsAndPayments();
      }
    } catch (err) {
      console.error("Error creating complaint:", err);
    } finally {
      setComplaintSubmitting(false);
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
        setSelectedInvoice({
          ...matched,
          delivery_address: matched.delivery_address || rentalOrPayment.delivery_address
        });
      } else {
        const rentPrice = rentalOrPayment.monthly_rent || (rentalOrPayment.appliance?.pricing ? rentalOrPayment.appliance.pricing[rentalOrPayment.tenure || "3"] : (rentalOrPayment.appliance?.monthly_price || 500));
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
          delivery_address: rentalOrPayment.delivery_address,
          items_summary: [{
            rental_name: rentalOrPayment.appliance?.rental_name || 'Premium Appliance',
            category_id: rentalOrPayment.appliance?.category_id || 'Appliances',
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
        ? `A certified technician has been scheduled for ${serviceModal.rental.appliance?.rental_name || 'your appliance'} on ${dateSlot || 'tomorrow'} (${timeSlot}). Ticket #SERV-${Math.floor(100000 + Math.random() * 900000)}.`
        : `Your relocation request to ${relocationCity} has been logged. Our logistics team will coordinate packing & transit.`
    });
    setServiceModal(null);
    setServiceNotes('');
    setTimeout(() => {
      setServiceSuccess(null);
    }, 6000);
  };

  const handleConfirmSwap = async (swapPayload) => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/rentals/', {
        method: 'PATCH',
        body: JSON.stringify({
          rental_id: swapPayload.oldRental.rental_id,
          action: 'swap',
          new_appliance_id: swapPayload.newAppliance.appliance_id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setServiceSuccess({
          title: "🔄 Experience Swap Confirmed!",
          message: `Your style upgrade to "${swapPayload.newAppliance.rental_name}" is confirmed for ${swapPayload.exchangeDate} (${swapPayload.exchangeSlot}). Ticket #${data.swap_ticket_id || 'SWAP_SUCCESS'}. Free doorstep exchange guaranteed!`
        });
        fetchRentalsAndPayments();
      } else {
        alert("Failed to schedule swap. Please contact support.");
      }
    } catch (e) {
      console.error("Error confirming swap:", e);
    }
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
      
      {/* Experience Swap Modal (Rentora Signature) */}
      <ExperienceSwapModal
        isOpen={!!swapModalRental}
        rental={swapModalRental}
        catalog={catalog}
        onClose={() => setSwapModalRental(null)}
        onConfirmSwap={handleConfirmSwap}
      />

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
              Product: <strong>{serviceModal.rental.appliance?.rental_name || 'Appliance'}</strong>
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
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary-color, #111827)', letterSpacing: '-0.02em' }}>
              Rent<span style={{ color: '#e23744' }}>ora</span>
            </span>
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link 
              to="/" 
              className="nav-action-btn"
              style={{ cursor: 'pointer' }}
            >
              ← Back to Catalog
            </Link>
            <Link 
              to="/cart" 
              className="nav-cart-btn"
              style={{ cursor: 'pointer' }}
            >
              Cart
            </Link>
            <ThemeToggle />
            <button 
              onClick={handleLogout} 
              className="btn-secondary" 
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
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

        {/* Buyout Success Alert Banner */}
        {buyoutSuccessAlert && (
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            border: '1px solid #4338ca',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
            position: 'relative'
          }}>
            <Award size={28} color="#fde047" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fef08a' }}>{buyoutSuccessAlert.title}</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', color: '#e0e7ff' }}>{buyoutSuccessAlert.message}</div>
            </div>
            {buyoutSuccessAlert.rental && (
              <button
                type="button"
                onClick={() => setCertificateModalRental(buyoutSuccessAlert.rental)}
                style={{
                  background: '#fde047',
                  color: '#1e1b4b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                View Deed 📜
              </button>
            )}
            <button 
              onClick={() => setBuyoutSuccessAlert(null)}
              style={{ background: 'none', border: 'none', color: '#c7d2fe', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Tenure Extension Success Banner */}
        {tenureSuccessAlert && (
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
            <Zap size={24} color="#059669" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tenureSuccessAlert.title}</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{tenureSuccessAlert.message}</div>
            </div>
            <button 
              onClick={() => setTenureSuccessAlert(null)}
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

        {/* Real-Time WebSocket Notification Banner */}
        {liveNotification && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={20} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#93c5fd' }}>
                  {liveNotification.title}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginTop: '0.15rem' }}>
                  {liveNotification.message}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {liveNotification.timestamp}
              </span>
              <button
                type="button"
                onClick={() => setLiveNotification(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
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

          {/* Quick assurance badges & Live Socket status */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: socketConnected ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${socketConnected ? '#a7f3d0' : '#e2e8f0'}`,
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: socketConnected ? '#059669' : '#64748b'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: socketConnected ? '#10b981' : '#94a3b8',
                display: 'inline-block',
                boxShadow: socketConnected ? '0 0 6px #10b981' : 'none'
              }} />
              <Wifi size={13} />
              <span>{socketConnected ? 'Live Tracker Active' : 'Connecting...'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #ebebeb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
              <ShieldCheck size={14} /> 100% Refundable Deposits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #ebebeb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
              <Truck size={14} /> Free Relocation
            </div>
          </div>
        </div>

        {/* Recurring Billing & 1-Click Pay Due Banner */}
        {(() => {
          const activeRentals = rentals.filter(r => (r.status === 'ACTIVE' || !r.status) && r.status !== 'OWNED');
          const totalMonthlyDue = activeRentals.reduce((sum, r) => sum + (r.monthly_price || r.appliance?.monthly_price || 0), 0);
          
          if (totalMonthlyDue <= 0 && !billPaySuccess) return null;

          return (
            <div style={{ marginBottom: '2rem' }}>
              {billPaySuccess && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#065f46'
                }}>
                  <CheckCircle size={22} color="#059669" />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Monthly Subscription Renewed! ⚡</strong>
                    <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                      Payment of ₹{billPaySuccess.amount.toLocaleString()} received on {billPaySuccess.date}. Next cycle extended by +30 days with ₹0 penalties.
                    </div>
                  </div>
                </div>
              )}

              {totalMonthlyDue > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                  borderRadius: '16px',
                  padding: '1.5rem 1.75rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  boxShadow: '0 8px 25px rgba(49, 46, 129, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={28} color="#fde047" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: 'rgba(253, 224, 71, 0.2)',
                          color: '#fef08a',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          Upcoming Billing • Due in 5 Days
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Cycle: 5th of Month</span>
                      </div>

                      <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em' }}>
                        ₹{totalMonthlyDue.toLocaleString()}
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#cbd5e1', marginLeft: '0.35rem' }}>/ month total</span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#e0e7ff' }}>
                        Covers <strong>{activeRentals.length} active appliance(s)</strong> • Protected by ₹10,000 damage waiver & ₹0 late fee protection
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Autopay Toggle */}
                    <div 
                      onClick={() => setAutoPayEnabled(!autoPayEnabled)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '18px',
                        borderRadius: '10px',
                        background: autoPayEnabled ? '#10b981' : '#64748b',
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: autoPayEnabled ? '16px' : '2px',
                          transition: 'left 0.2s'
                        }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                        UPI AutoPay {autoPayEnabled ? 'ON' : 'OFF'}
                      </div>
                    </div>

                    {/* Pay Due Button */}
                    <button
                      type="button"
                      onClick={() => handlePayMonthlyBill(totalMonthlyDue)}
                      disabled={payingBillLoading}
                      style={{
                        background: '#ffffff',
                        color: '#312e81',
                        border: 'none',
                        padding: '0.75rem 1.35rem',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        cursor: payingBillLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {payingBillLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing UPI...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={16} color="#7c3aed" />
                          <span>Pay Due Now (₹{totalMonthlyDue.toLocaleString()})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Navigation Tabs: Active Leases vs Owned Assets vs Payment History */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '2rem',
          flexWrap: 'wrap'
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
              {rentals.filter(r => r.status !== 'OWNED').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('owned')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'owned' ? '#4338ca' : '#6b7280',
              borderBottom: activeTab === 'owned' ? '3px solid #4338ca' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s'
            }}
          >
            <Award size={18} color={activeTab === 'owned' ? '#4338ca' : '#6b7280'} />
            <span>Owned Assets (Buyouts)</span>
            <span style={{
              background: activeTab === 'owned' ? '#e0e7ff' : '#f3f4f6',
              color: activeTab === 'owned' ? '#3730a3' : '#6b7280',
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {rentals.filter(r => r.status === 'OWNED').length}
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

          <button
            type="button"
            onClick={handleExportCustomerData}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              border: '1px solid #d1d5db',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            <Download size={14} color="#4b5563" />
            <span>Export {activeTab === 'payments' ? 'Payments' : 'Leases'} (CSV)</span>
          </button>
        </div>
        
        {/* TAB 1 & TAB 3: ACTIVE LEASES & OWNED ASSETS */}
        {(activeTab === 'rentals' || activeTab === 'owned') && (() => {
          const isOwnedTab = activeTab === 'owned';
          const displayedRentals = rentals.filter(r => isOwnedTab ? r.status === 'OWNED' : r.status !== 'OWNED');

          if (displayedRentals.length === 0) {
            return isOwnedTab ? (
              <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#ffffff', border: '1px solid #ebebeb', borderRadius: '16px' }}>
                <Award size={52} color="#4338ca" style={{ margin: '0 auto 1.25rem' }} />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#1e1b4b' }}>No Permanently Owned Assets Yet</h2>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  Convert any active rental into 100% legal ownership with 70% rent equity credit and zero security deposit deduction!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('rentals')}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Sparkles size={15} />
                  <span>View Active Leases to Buyout</span>
                </button>
              </div>
            ) : (
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
            );
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
              {displayedRentals.map(rental => {
                const isOwned = rental.status === 'OWNED';

                return (
                <div 
                  key={rental.rental_id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: '#ffffff', 
                    border: isOwned ? '2px solid #c7d2fe' : '1px solid #ebebeb', 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    boxShadow: isOwned ? '0 10px 25px rgba(67, 56, 202, 0.08)' : '0 2px 10px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {/* Photo Header */}
                  <div style={{ height: '210px', background: '#f8f8f8', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={rental.appliance?.image_url || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'} 
                      alt={rental.appliance?.rental_name || 'Appliance'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      background: isOwned ? '#fef3c7' : '#ecfdf5', 
                      color: isOwned ? '#92400e' : '#059669', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {isOwned ? '🏆 100% Owned' : 'Active Lease'}
                    </span>
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px', 
                      background: isOwned ? 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' : '#e23744', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      {isOwned ? '💎 Permanent Asset' : `${rental.tenure || "3"} Months Tenure`}
                    </span>
                    <span style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: isOwned ? 'rgba(30, 27, 75, 0.92)' : ((rental.delivery_status === 'DELIVERED' || rental.status === 'delivered') ? 'rgba(5, 150, 105, 0.95)' : 'rgba(15, 23, 42, 0.85)'),
                      color: '#ffffff',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}>
                      {isOwned ? <Award size={12} color="#fde047" /> : <Truck size={12} />}
                      <span>
                        {isOwned 
                          ? 'Title Transferred' 
                          : ((rental.delivery_status === 'DELIVERED' || rental.status === 'delivered')
                            ? 'Delivered & Installed'
                            : (rental.delivery_status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'In Quality Check'))}
                      </span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {rental.appliance?.category_id || 'Appliances'}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', color: '#111827', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.3 }}>
                      {rental.appliance?.rental_name || 'Premium Appliance'}
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
                          ₹{rental.appliance?.pricing ? rental.appliance.pricing[rental.tenure || "3"] : (rental.monthly_rent || rental.appliance?.monthly_price || 500)}/mo
                        </strong>
                      </div>
                    </div>

                    {/* Delivery Destination & Schedule Badge */}
                    {rental.delivery_address && (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '0.6rem 0.75rem',
                        marginBottom: '1rem',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#166534', fontWeight: 700, marginBottom: '0.2rem' }}>
                          <Truck size={13} />
                          <span>Delivery & Assembly Destination:</span>
                        </div>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>
                          {rental.delivery_address.house_flat ? `${rental.delivery_address.house_flat}, ` : ''}
                          {rental.delivery_address.street_area || ''} ({rental.delivery_address.city || 'Bangalore'} - {rental.delivery_address.pincode})
                        </div>
                        {rental.delivery_address.delivery_slot && (
                          <div style={{ color: '#15803d', fontSize: '0.72rem', marginTop: '0.25rem', fontWeight: 600 }}>
                            ⚡ Slot: {rental.delivery_address.delivery_slot}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ height: '1px', background: '#f3f4f6', margin: '0 0 1.25rem' }} />

                    {/* Action Buttons Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: 'auto' }}>
                      
                      {isOwned ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <div style={{
                            background: '#fefce8',
                            border: '1.5px solid #fef08a',
                            borderRadius: '10px',
                            padding: '0.75rem',
                            textAlign: 'center'
                          }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#854d0e', fontWeight: 800, fontSize: '0.85rem' }}>
                              <Award size={16} color="#d97706" />
                              <span>100% Permanently Owned</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '0.2rem' }}>
                              Zero monthly recurring liability • Deed in Registry
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCertificateModalRental(rental)}
                            style={{
                              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.7rem 0.85rem',
                              borderRadius: '10px',
                              fontSize: '0.825rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(49, 46, 129, 0.25)'
                            }}
                          >
                            <Award size={15} color="#fde047" />
                            <span>View Ownership Certificate</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* 1. Track Delivery Button */}
                          <button
                            type="button"
                            onClick={() => setTrackingModalRental(rental)}
                            style={{
                              background: '#0f172a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.825rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <Truck size={15} color="#38bdf8" />
                              <span>Track Delivery & Installation</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                              <span>OTP: <strong style={{ color: '#4ade80', fontFamily: 'monospace' }}>{rental.delivery_tracking?.delivery_otp || '4829'}</strong></span>
                              <span>→</span>
                            </div>
                          </button>

                          {/* 2. Rent-to-Own Equity Buyout Button */}
                          <button
                            type="button"
                            onClick={() => setBuyoutModalRental(rental)}
                            style={{
                              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.825rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(49, 46, 129, 0.3)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            <Sparkles size={14} color="#fde047" />
                            <span>Own This Item (Rent-to-Own Buyout)</span>
                          </button>

                          {/* 3. Style Upgrade & Tenure Extension Row */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setSwapModalRental(rental)}
                              style={{
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: '1.5px solid #bae6fd',
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
                              <RefreshCw size={13} color="#0284c7" />
                              <span>Style Upgrade</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setBuyoutModalRental(rental)}
                              style={{
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1.5px solid #ddd6fe',
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
                              <Zap size={13} color="#7c3aed" />
                              <span>Extend (Save 20%)</span>
                            </button>
                          </div>

                          {/* 4. Maintenance & Free Shifting Row */}
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

                          {/* 5. Return Appliance Button */}
                          <button 
                            onClick={() => handleOpenReturnModal(rental)}
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
                        </>
                      )}

                    </div>

                  </div>
                </div>
              )})}
            </div>
          );
        })()}

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

        {/* TAB 3: CUSTOMER GRIEVANCES & SUPPORT TICKETS */}
        {activeTab === 'complaints' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Support Grievances & Service Complaints</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Track your service requests, quality inquiries, or submit a new grievance ticket.
                </p>
              </div>
              <button
                onClick={() => setIsComplaintModalOpen(true)}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <MessageSquare size={16} /> Raise Support Ticket
              </button>
            </div>

            {complaints.length === 0 ? (
              <div className="panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <ShieldCheck size={36} color="#16a34a" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ margin: 0, color: '#0f172a' }}>No active grievances or complaints</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Your rented appliances are in good standing. Need help? Raise a ticket anytime.</p>
              </div>
            ) : (
              <div className="panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Ticket Reference</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Category</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Subject & Description</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Admin Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0284c7' }}>
                          {c.ticket_id}
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {c.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.subject}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{c.description}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{
                            background: c.status === 'RESOLVED' ? '#dcfce7' : '#fee2e2',
                            color: c.status === 'RESOLVED' ? '#15803d' : '#b91c1c',
                            padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.75rem'
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: c.resolution_notes ? '#166534' : '#94a3b8' }}>
                          {c.resolution_notes ? `✓ ${c.resolution_notes}` : 'Under review by operations team'}
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

      {/* MODAL: RETURN MANAGEMENT & DAMAGE INSPECTION (Module 6) */}
      {returnModalRental && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setReturnModalRental(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#fee2e2', padding: '0.6rem', borderRadius: '50%', color: '#dc2626' }}>
                <Package size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Return Appliance & Claim Deposit</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  {returnModalRental.appliance?.rental_name || 'Appliance'} • Held Deposit: ₹{returnModalRental.security_deposit || 750}
                </p>
              </div>
            </div>

            {/* Damage Condition Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                Physical Condition Assessment:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'NONE', label: 'Flawless / Normal Wear', sub: 'Standard wear & tear • 100% Deposit Refunded', fee: 0, waiver: false },
                  { id: 'MINOR', label: 'Minor Surface Scuffs / Hairline Scratches', sub: '🛡️ Covered by Rentora ₹10,000 Accidental Damage Waiver • ₹0 Deduction', fee: 0, waiver: true },
                  { id: 'MODERATE', label: 'Moderate Cosmetic Dents / Spills', sub: '🛡️ Covered by Rentora ₹10,000 Accidental Damage Waiver • ₹0 Deduction', fee: 0, waiver: true },
                  { id: 'SEVERE', label: 'Severe Hardware / Electrical Breakage', sub: 'Exceeds waiver limit • ₹800 repair fee assessed from deposit', fee: 800, waiver: false },
                ].map(opt => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: damageLevel === opt.id ? '2px solid #e23744' : '1px solid #e2e8f0',
                      background: damageLevel === opt.id ? '#fff1f2' : '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="damageLevel"
                      value={opt.id}
                      checked={damageLevel === opt.id}
                      onChange={(e) => setDamageLevel(e.target.value)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: opt.waiver ? '#15803d' : '#64748b' }}>{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Damage Notes */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                Condition Notes (Optional):
              </label>
              <textarea
                rows={2}
                placeholder="Mention any specific remarks regarding power cords, packaging, or accessories..."
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
              />
            </div>

            {/* Fine & Refund Breakdown */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#64748b' }}>
                <span>Held Security Deposit:</span>
                <span>₹{returnModalRental.security_deposit || 750}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#64748b' }}>
                <span>Damage Fine (₹10k Waiver Active):</span>
                <span style={{ color: damageLevel === 'SEVERE' ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                  {damageLevel === 'SEVERE' ? '-₹800' : '₹0 (Waived)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                <span>Net Refund to Credit:</span>
                <span style={{ color: '#16a34a' }}>
                  ₹{Math.max(0, (returnModalRental.security_deposit || 750) - (damageLevel === 'SEVERE' ? 800 : 0))}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setReturnModalRental(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnAssessment}
                disabled={returningLoading}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', background: '#dc2626', borderColor: '#dc2626' }}
              >
                {returningLoading ? 'Processing Refund...' : 'Confirm Return & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT SUPPORT COMPLAINT (Module 8) */}
      {isComplaintModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsComplaintModalOpen(false)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.35rem' }}>
              Submit Customer Service Grievance
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
              Our operations supervisor will review this ticket and contact you within 2 hours.
            </p>

            <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Issue Category</label>
                <select
                  className="input-field"
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                >
                  <option value="Delivery / Installation">Delivery / Installation Delay</option>
                  <option value="Appliance Quality">Appliance Quality / Maintenance</option>
                  <option value="Billing / Deposit">Billing & Security Deposit Inquiry</option>
                  <option value="Relocation / Shift">Intercity Relocation Assistance</option>
                  <option value="General Inquiry">Other Service Matter</option>
                </select>
              </div>

              <div>
                <label className="input-label">Subject</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Brief summary of the issue"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Detailed Description</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Describe your grievance or service request in detail..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={complaintSubmitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {complaintSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={selectedInvoice}
      />

      {/* Delivery Tracking Modal */}
      <DeliveryTrackerModal
        isOpen={!!trackingModalRental}
        onClose={() => setTrackingModalRental(null)}
        rental={trackingModalRental}
        onRentalUpdated={fetchRentalsAndPayments}
      />

      {/* Rent-to-Own Buyout & Tenure Extension Modal */}
      {buyoutModalRental && (
        <RentToOwnModal
          rental={buyoutModalRental}
          onClose={() => setBuyoutModalRental(null)}
          onBuyoutSuccess={handleBuyoutSuccess}
          onTenureExtended={handleTenureExtended}
        />
      )}

      {/* Official Certificate of Ownership Modal */}
      {certificateModalRental && (
        <OwnershipCertificateModal
          rental={certificateModalRental}
          onClose={() => setCertificateModalRental(null)}
        />
      )}
    </div>
  );
};

export default MyRentalsPage;
