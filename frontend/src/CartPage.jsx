import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Lock,
  MapPin,
  Truck,
  Calendar,
  Sparkles,
  Phone,
  AlertCircle,
  Building,
  Check,
  Plus,
  Briefcase
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import PaymentGatewayModal from './PaymentGatewayModal';
import ThemeToggle from './ThemeToggle';
import InvoiceReceiptModal from './InvoiceReceiptModal';

const DELIVERY_SLOTS = [
  { id: 'Express (Within 24-48 Hours)', label: '⚡ Express Delivery (Within 24-48 Hours)', badge: 'Fastest', subtext: 'Dispatched immediately from nearest regional warehouse' },
  { id: 'Morning Slot (10:00 AM – 01:00 PM)', label: '🌅 Morning Slot (10:00 AM – 01:00 PM)', badge: 'Preferred', subtext: 'Doorstep technician assembly before noon' },
  { id: 'Evening Slot (04:00 PM – 07:00 PM)', label: '🌇 Evening Slot (04:00 PM – 07:00 PM)', badge: 'After Work', subtext: 'Convenient post-office delivery & demo' },
  { id: 'Weekend Slot (Saturday / Sunday)', label: '📅 Weekend Preferred (Saturday / Sunday)', badge: 'Weekend', subtext: 'Scheduled weekend installation at your convenience' }
];

const CartPage = ({ onLogout }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [companionRecs, setCompanionRecs] = useState([]);
  const [addingCompanionId, setAddingCompanionId] = useState(null);

  // Address Book & Scheduling state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressType, setNewAddressType] = useState('Home');
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState({
    recipient_name: '',
    phone: '',
    house_flat: '',
    street_area: '',
    landmark: '',
    city: 'Hyderabad',
    pincode: '500081',
    delivery_slot: 'Express (Within 24-48 Hours)',
    address_type: 'Home'
  });
  const [addressError, setAddressError] = useState('');
  const [kycData, setKycData] = useState(null);
  const [kycAutoFilled, setKycAutoFilled] = useState(false);

  const navigate = useNavigate();

  const fetchSavedAddresses = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/addresses/');
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data);
        if (data && data.length > 0) {
          const defaultAddr = data.find(a => a.is_default) || data[0];
          setSelectedAddressId(defaultAddr._id);
          setDeliveryAddress(prev => ({
            ...prev,
            recipient_name: defaultAddr.recipient_name,
            phone: defaultAddr.phone,
            house_flat: defaultAddr.house_flat,
            street_area: defaultAddr.street_area,
            landmark: defaultAddr.landmark || '',
            city: defaultAddr.city || 'Bangalore',
            pincode: defaultAddr.pincode,
            address_type: defaultAddr.type || 'Home'
          }));
        }
      }
    } catch (e) {
      console.error('Error fetching address book:', e);
    }
  };

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setDeliveryAddress(prev => ({
      ...prev,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      house_flat: addr.house_flat,
      street_area: addr.street_area,
      landmark: addr.landmark || '',
      city: addr.city || 'Bangalore',
      pincode: addr.pincode,
      address_type: addr.type || 'Home'
    }));
    setShowAddAddressForm(false);
    setAddressError('');
  };

  const handleSaveNewAddress = async (e) => {
    if (e) e.preventDefault();
    if (!deliveryAddress.recipient_name.trim() || !deliveryAddress.phone.trim() || !deliveryAddress.house_flat.trim() || !deliveryAddress.street_area.trim() || !deliveryAddress.pincode.trim()) {
      setAddressError('Please fill out all required address fields.');
      return;
    }
    setSavingNewAddress(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/addresses/', {
        method: 'POST',
        body: JSON.stringify({
          type: newAddressType,
          recipient_name: deliveryAddress.recipient_name,
          phone: deliveryAddress.phone,
          house_flat: deliveryAddress.house_flat,
          street_area: deliveryAddress.street_area,
          landmark: deliveryAddress.landmark,
          city: deliveryAddress.city || 'Bangalore',
          pincode: deliveryAddress.pincode,
          is_default: savedAddresses.length === 0
        })
      });
      if (res.ok) {
        const created = await res.json();
        setSavedAddresses(prev => [created, ...prev]);
        setSelectedAddressId(created._id);
        setShowAddAddressForm(false);
        setAddressError('');
      } else {
        const d = await res.json();
        setAddressError(d.error || 'Failed to save address to address book');
      }
    } catch (err) {
      console.error('Error saving address:', err);
      setAddressError('Failed to save address');
    } finally {
      setSavingNewAddress(false);
    }
  };

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

  const fetchUserKycAddress = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/kyc/');
      if (res.ok) {
        const data = await res.json();
        setKycData(data);
        if (data && data.full_name) {
          setDeliveryAddress(prev => ({
            ...prev,
            recipient_name: prev.recipient_name || data.full_name || '',
            street_area: prev.street_area || data.address_line || ''
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching KYC profile:', err);
    }
  };

  const fetchCompanionRecs = async () => {
    try {
      const city = deliveryAddress.city || localStorage.getItem('rentora_city') || 'Bangalore';
      const res = await fetchWithAuth(`http://localhost:8000/api/recommendations/?filter=room_bundles&city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const data = await res.json();
        setCompanionRecs(data);
      }
    } catch (e) {
      console.error('Error fetching companion recommendations:', e);
    }
  };

  const handleAddCompanion = async (rec) => {
    const app = rec.recommended_appliance_details;
    if (!app) return;
    const appId = app.appliance_id || app._id;
    setAddingCompanionId(appId);
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/cart/', {
        method: 'POST',
        body: JSON.stringify({
          appliance_id: appId,
          tenure: "6"
        })
      });
      if (res.ok) {
        await fetchCart();
        await fetchCompanionRecs();
      }
    } catch (e) {
      console.error('Error adding companion to cart:', e);
    } finally {
      setAddingCompanionId(null);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchUserKycAddress();
    fetchSavedAddresses();
    fetchCompanionRecs();
  }, []);

  const handleAutoFillFromKyc = () => {
    if (!kycData) return;
    setDeliveryAddress(prev => ({
      ...prev,
      recipient_name: kycData.full_name || prev.recipient_name,
      street_area: kycData.address_line || prev.street_area,
      city: 'Hyderabad',
      pincode: '500081'
    }));
    setKycAutoFilled(true);
    setAddressError('');
  };

  const handleRemove = async (applianceId) => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/cart/', {
        method: 'DELETE',
        body: JSON.stringify({ appliance_id: applianceId })
      });
      if (res.ok) {
        setCartItems(cartItems.filter(item => item.appliance.appliance_id !== applianceId));
        fetchCompanionRecs();
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Validate Delivery Address & Pre-validate KYC before opening payment gateway
  const handleInitiatePayment = async () => {
    if (!deliveryAddress.recipient_name.trim()) {
      setAddressError('Please enter recipient contact name for doorstep delivery coordination.');
      return;
    }
    const cleanPhone = deliveryAddress.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setAddressError('Please enter a valid 10-digit mobile number for logistics coordinator.');
      return;
    }
    if (!deliveryAddress.house_flat.trim()) {
      setAddressError('Please enter your Flat/House No. and Apartment/Society name.');
      return;
    }
    if (!deliveryAddress.street_area.trim()) {
      setAddressError('Please enter your Street name, Area or Locality.');
      return;
    }
    const cleanPin = deliveryAddress.pincode.replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      setAddressError('Please enter a valid 6-digit postal pincode.');
      return;
    }

    setAddressError('');

    try {
      const res = await fetchWithAuth('http://localhost:8000/api/kyc/');
      if (res.ok) {
        const kyc = await res.json();
        if (kyc.status !== 'approved') {
          navigate('/kyc');
          return;
        }
      }
      setIsPaymentModalOpen(true);
    } catch (e) {
      console.error("KYC check failed:", e);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = async (paymentPayload) => {
    setIsPaymentModalOpen(false);
    setCheckingOut(true);
    try {
      const formattedAddress = [
        deliveryAddress.house_flat,
        deliveryAddress.street_area,
        deliveryAddress.landmark ? `Near ${deliveryAddress.landmark}` : '',
        deliveryAddress.city,
        deliveryAddress.pincode
      ].filter(Boolean).join(', ');

      const res = await fetchWithAuth('http://localhost:8000/api/checkout/', {
        method: 'POST',
        body: JSON.stringify({
          ...paymentPayload,
          delivery_address: {
            ...deliveryAddress,
            formatted_address: formattedAddress
          }
        })
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
          payment_method: paymentPayload.payment_method,
          delivery_address: {
            ...deliveryAddress,
            formatted_address: formattedAddress
          }
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '5rem' }}>
      {/* Top Navigation */}
      <nav className="panel" style={{ borderRadius: '0', position: 'sticky', top: 0, zIndex: 50, borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon size={22} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Rentora</h2>
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/rentals" className="nav-action-btn" style={{ cursor: 'pointer' }}>
              My Rentals
            </Link>
            <ThemeToggle />
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container animate-fade-in" style={{ padding: '2.5rem 2rem', maxWidth: '1100px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1.75rem', color: 'var(--secondary-color)', fontWeight: 800 }}>
          {checkoutSuccess ? 'Order Confirmation' : 'Review Cart & Delivery Address'}
        </h1>
        
        {checkoutSuccess ? (
          /* ========================================================
             ORDER SUCCESS & CONFIRMED DESTINATION
             ======================================================== */
          <div className="panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'white', maxWidth: '680px', margin: '0 auto', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: '#dcfce7', width: '84px', height: '84px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #bbf7d0' }}>
                <CheckCircle2 color="#16a34a" size={52} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 800 }}>
              Payment & Rental Order Confirmed!
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Your appliances have been reserved from our regional logistics hub. Doorstep delivery, installation, and live inspection are scheduled.
            </p>

            {completedPayment && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                {/* Transaction Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>TRANSACTION ID</span>
                    <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{completedPayment.transaction_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>INVOICE NUMBER</span>
                    <strong style={{ color: '#0f172a' }}>{completedPayment.invoice_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>PAYMENT METHOD</span>
                    <strong style={{ color: '#0f172a' }}>{completedPayment.payment_method || 'UPI Gateway'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>AMOUNT PAID</span>
                    <strong style={{ color: '#16a34a', fontSize: '1rem' }}>₹{Number(completedPayment.amount_total || totalDue).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Confirmed Delivery Destination */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <MapPin size={16} color="#e23744" /> Confirmed Delivery & Assembly Destination
                  </div>
                  <div style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>
                    {completedPayment.delivery_address?.recipient_name} • 📞 {completedPayment.delivery_address?.phone}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                    {completedPayment.delivery_address?.formatted_address}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <Truck size={13} /> {completedPayment.delivery_address?.delivery_slot || 'Express (Within 24-48 Hours)'}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {completedPayment && (
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem' }}
                >
                  <FileText size={18} /> View & Print Tax Invoice
                </button>
              )}
              <Link to="/rentals" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', padding: '0.75rem 1.5rem' }}>
                Track in My Rentals <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'white' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '2rem' }}>Your cart is currently empty.</p>
            <Link to="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Browse Appliance Catalog</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Left Column: Cart Items + Delivery Address Form */}
            <div style={{ flex: '1 1 580px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Cart Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.map(item => (
                  <div key={item.cart_item_id} className="panel" style={{ display: 'flex', padding: '1.25rem', background: 'white', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ width: '100px', height: '100px', background: '#f8fafc', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, border: '1px solid #f1f5f9' }}>
                      <img 
                        src={item.appliance.image_url} 
                        alt={item.appliance.rental_name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.2rem' }}>{item.appliance.rental_name}</h3>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.appliance.category_id}</span>
                        </div>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {item.tenure || "3"} Mos Plan
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Monthly Rent</span>
                            <strong style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>₹{getMonthlyRent(item)}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Deposit (Refundable)</span>
                            <strong style={{ fontWeight: 600, fontSize: '0.95rem', color: '#059669' }}>₹{getSecurityDeposit(item)}</strong>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemove(item.appliance.appliance_id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Frequently Rented Together / Complete Your Living Setup */}
              {companionRecs.length > 0 && (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Sparkles size={18} color="#e23744" />
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                        Frequently Rented Together (Complete Your Setup)
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>
                      15% Room Combo Discount
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.85rem'
                  }}>
                    {companionRecs.slice(0, 3).map((rec, i) => {
                      const app = rec.recommended_appliance_details;
                      if (!app) return null;
                      const appId = app.appliance_id || app._id;
                      const isAdding = addingCompanionId === appId;

                      return (
                        <div
                          key={rec.recommendation_id || i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '1px solid #f1f5f9',
                            background: '#f8fafc'
                          }}
                        >
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#ffffff', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                            <img src={app.image_url} alt={app.rental_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {app.rental_name}
                            </h4>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <strong style={{ color: '#0f172a' }}>₹{app.monthly_price}/mo</strong>
                              <span>• {rec.match_percentage || 94}% Match</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#e23744', fontWeight: 600, marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {rec.recommendation_reason}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddCompanion(rec)}
                            disabled={isAdding}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#0f172a',
                              cursor: isAdding ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              flexShrink: 0,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#e23744'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#e23744'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            <span>{isAdding ? 'Adding...' : 'Add'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================
                  DELIVERY ADDRESS & TIME SLOT FORM (Enterprise Address Book)
                  ======================================================== */}
              <div className="panel" style={{ padding: '1.75rem', background: '#ffffff', border: addressError ? '1.5px solid #ef4444' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: '#fef2f2', padding: '0.45rem', borderRadius: '8px' }}>
                      <MapPin size={20} color="#e23744" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                        Select Delivery & Assembly Address
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        Free doorstep delivery, unboxing, professional leveling & installation included.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {kycData && kycData.address_line && (
                      <button
                        type="button"
                        onClick={handleAutoFillFromKyc}
                        style={{
                          background: kycAutoFilled ? '#ecfdf5' : '#f8fafc',
                          border: `1px solid ${kycAutoFilled ? '#10b981' : '#cbd5e1'}`,
                          color: kycAutoFilled ? '#047857' : '#334155',
                          borderRadius: '6px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                        title="Import verified address from your submitted KYC documents"
                      >
                        {kycAutoFilled ? <Check size={14} /> : <ShieldCheck size={14} color="#10b981" />}
                        <span>{kycAutoFilled ? 'KYC Applied' : 'Auto-Fill from KYC'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                      style={{
                        background: showAddAddressForm ? '#f1f5f9' : '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Plus size={14} />
                      <span>{showAddAddressForm ? 'View Saved Addresses' : 'Add New Address'}</span>
                    </button>
                  </div>
                </div>

                {addressError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    marginBottom: '1.25rem'
                  }}>
                    <AlertCircle size={16} />
                    <span>{addressError}</span>
                  </div>
                )}

                {/* SAVED ADDRESS CARDS GRID */}
                {!showAddAddressForm && savedAddresses.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <div
                            key={addr._id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            style={{
                              border: `2px solid ${isSelected ? '#e23744' : '#e2e8f0'}`,
                              background: isSelected ? '#fffdfd' : '#ffffff',
                              borderRadius: '12px',
                              padding: '1rem',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 4px 12px rgba(226, 55, 68, 0.08)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <input
                                  type="radio"
                                  name="selected_address"
                                  checked={isSelected}
                                  onChange={() => handleSelectSavedAddress(addr)}
                                  style={{ accentColor: '#e23744', cursor: 'pointer' }}
                                />
                                <span style={{
                                  background: addr.type === 'Work' ? '#eff6ff' : '#fef2f2',
                                  color: addr.type === 'Work' ? '#1d4ed8' : '#b91c1c',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  textTransform: 'uppercase'
                                }}>
                                  {addr.type === 'Work' ? '💼 Work / Office' : (addr.type === 'Other' ? '📍 Other' : '🏠 Home')}
                                </span>
                              </div>

                              {addr.is_default && (
                                <span style={{ fontSize: '0.68rem', color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                                  Default
                                </span>
                              )}
                            </div>

                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                              {addr.recipient_name}
                              {addr.phone && <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.8rem' }}> • +91 {addr.phone}</span>}
                            </div>

                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                              {addr.house_flat}, {addr.street_area}{addr.landmark ? `, Near ${addr.landmark}` : ''}, <strong>{addr.city}</strong> - {addr.pincode}
                            </p>

                            {isSelected && (
                              <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px dashed #fecdd3', color: '#e23744', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={12} /> Deliver to this address
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ADD / EDIT ADDRESS FORM DRAWER */}
                {(showAddAddressForm || savedAddresses.length === 0) && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                        Enter New Delivery Address
                      </h4>
                      {/* Address Type Tag Selector */}
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {['Home', 'Work', 'Other'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewAddressType(type)}
                            style={{
                              border: `1px solid ${newAddressType === type ? '#e23744' : '#cbd5e1'}`,
                              background: newAddressType === type ? '#fee2e2' : '#ffffff',
                              color: newAddressType === type ? '#b91c1c' : '#475569',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          Recipient Contact Name *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.recipient_name}
                          onChange={(e) => {
                            setDeliveryAddress({ ...deliveryAddress, recipient_name: e.target.value });
                            setAddressError('');
                          }}
                          placeholder="e.g. Rahul Sharma"
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          Contact Mobile (+91) *
                        </label>
                        <input
                          type="tel"
                          value={deliveryAddress.phone}
                          onChange={(e) => {
                            setDeliveryAddress({ ...deliveryAddress, phone: e.target.value });
                            setAddressError('');
                          }}
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          Flat / House No. & Apartment / Society Name *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.house_flat}
                          onChange={(e) => {
                            setDeliveryAddress({ ...deliveryAddress, house_flat: e.target.value });
                            setAddressError('');
                          }}
                          placeholder="e.g. Flat 402, Tower B, Prestige Green Meadows"
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          Street / Road / Locality *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.street_area}
                          onChange={(e) => {
                            setDeliveryAddress({ ...deliveryAddress, street_area: e.target.value });
                            setAddressError('');
                          }}
                          placeholder="e.g. Hitech City Main Road, Madhapur"
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.landmark}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                          placeholder="e.g. Opposite Cyber Towers"
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          City *
                        </label>
                        <select
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                        >
                          <option value="Hyderabad">Hyderabad</option>
                          <option value="Bangalore">Bangalore</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Delhi NCR">Delhi NCR</option>
                          <option value="Pune">Pune</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.pincode}
                          onChange={(e) => {
                            setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value });
                            setAddressError('');
                          }}
                          placeholder="e.g. 500081"
                          maxLength={6}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddAddressForm(false)}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveNewAddress}
                        disabled={savingNewAddress}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.45rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: savingNewAddress ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {savingNewAddress ? 'Saving...' : 'Save & Select Address'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Preferred Installation & Delivery Slot */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem' }}>
                    <Calendar size={16} color="#e23744" /> Select Preferred Installation & Delivery Slot
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
                    {DELIVERY_SLOTS.map((slot) => {
                      const isSelected = deliveryAddress.delivery_slot === slot.id;
                      return (
                        <div
                          key={slot.id}
                          onClick={() => setDeliveryAddress({ ...deliveryAddress, delivery_slot: slot.id })}
                          style={{
                            border: `1.5px solid ${isSelected ? '#e23744' : '#e2e8f0'}`,
                            background: isSelected ? '#fff5f5' : '#ffffff',
                            borderRadius: '10px',
                            padding: '0.75rem 0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: isSelected ? '#e23744' : '#0f172a' }}>
                              {slot.label}
                            </strong>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: isSelected ? '#fee2e2' : '#f1f5f9', color: isSelected ? '#b91c1c' : '#475569', padding: '1px 5px', borderRadius: '4px' }}>
                              {slot.badge}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                            {slot.subtext}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Free Assembly Perk Badge */}
                <div style={{
                  marginTop: '1.25rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: '#166534'
                }}>
                  <Truck size={16} color="#16a34a" />
                  <span><strong>Free Doorstep Logistics:</strong> Professional technicians will unpack, place, and test your appliances at zero labor fee.</span>
                </div>
              </div>

            </div>
            
            {/* Right Column: Order Summary & Checkout Trigger */}
            <div className="panel" style={{ flex: '1 1 340px', padding: '2rem', background: 'white', position: 'sticky', top: '6rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--secondary-color)', fontWeight: 800 }}>Order Summary</h3>
              
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
                <span>Delivery & Setup</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>₹0 Free</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '800' }}>
                <span>Total Due Today</span>
                <span style={{ color: '#e23744' }}>₹{totalDue.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ background: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>🛡️ <strong>Rentora Shield Active (₹0):</strong> Up to ₹10,000 accidental damage waiver included.</div>
                <div>✨ <strong>Rentora Premium Perks:</strong> Experience Swap & Free Relocation included with this order.</div>
                <div>🔒 <strong>Escrow Protected:</strong> ₹{totalDeposit.toLocaleString('en-IN')} deposit 100% refunded on return.</div>
              </div>

              <button 
                onClick={handleInitiatePayment}
                disabled={checkingOut}
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}
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
