import React, { useEffect, useState } from 'react';
import { 
  LogOut, 
  Activity, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingBag,
  PackageCheck,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  MessageSquare,
  Eye,
  RefreshCw,
  Truck,
  Package,
  Lock,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Download,
  BarChart2,
  Wifi,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './utils/api';
import ThemeToggle from './ThemeToggle';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  Legend 
} from 'recharts';
import { getSocket, joinAdminRoom } from './utils/socket';
import { downloadCsv, exportViaServer } from './utils/exportCsv';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'inventory' | 'users' | 'rentals' | 'complaints'
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);
  
  // Overview data
  const [dashboardData, setDashboardData] = useState({
    total_revenue: 0,
    active_rentals: 0,
    at_risk_customers: [],
    sales_analytics: null
  });
  const [loading, setLoading] = useState(true);

  // Inventory state (Module 2)
  const [appliances, setAppliances] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);
  const [applianceForm, setApplianceForm] = useState({
    rental_name: '',
    category_id: 'Appliances',
    sub_category: 'Home Appliances',
    brand: 'Rentora Select',
    monthly_price: 699,
    security_deposit: 1049,
    stock_quantity: 10,
    pricing_3: 699,
    pricing_6: 629,
    pricing_12: 559,
    available_cities: 'Hyderabad, Bangalore, Mumbai, Delhi, Pune',
    image_url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&q=80&w=600',
    description: 'Energy-efficient appliance with free periodic maintenance and doorstep relocation support.'
  });

  // Users state (Module 7)
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Rentals state (Module 7: Approve Rentals)
  const [allRentals, setAllRentals] = useState([]);
  const [rentalFilter, setRentalFilter] = useState('all');

  // Logistics & Dispatch state
  const [dispatchModalRental, setDispatchModalRental] = useState(null);
  const [dispatchStage, setDispatchStage] = useState('OUT_FOR_DELIVERY');
  const [dispatchTechName, setDispatchTechName] = useState('Rajesh Patil');
  const [dispatchTechPhone, setDispatchTechPhone] = useState('+91 98450 12891');
  const [dispatchVehicle, setDispatchVehicle] = useState('KA-01-EL-9284');
  const [dispatchOtpInput, setDispatchOtpInput] = useState('');
  const [dispatchUpdating, setDispatchUpdating] = useState(false);

  // Complaints state (Module 8)
  const [complaintsList, setComplaintsList] = useState([]);
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // KYC Moderation state
  const [kycList, setKycList] = useState([]);
  const [kycStats, setKycStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [kycFilter, setKycFilter] = useState('all');
  const [inspectingKyc, setInspectingKyc] = useState(null);
  const [rejectingKyc, setRejectingKyc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [kycLoading, setKycLoading] = useState(false);

  const navigate = useNavigate();

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(
    localStorage.getItem('user_role') === 'admin'
  );
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [verifying, setVerifying] = useState(false);


  const handleVerifyPasscode = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setPasscodeError('Please enter the Admin Security Key');
      return;
    }
    setVerifying(true);
    setPasscodeError('');
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/auth/switch-role/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', admin_code: passcode.trim() })
      });
      if (res.ok) {
        localStorage.setItem('user_role', 'admin');
        setIsAdminAuthorized(true);
      } else {
        const d = await res.json();
        setPasscodeError(d.error || 'Invalid Admin Authorization Passcode');
      }
    } catch (err) {
      setPasscodeError('Verification failed. Check server connection.');
    } finally {
      setVerifying(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/dashboard/');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/appliances/?all_stock=true');
      if (res.ok) {
        const data = await res.json();
        setAppliances(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/users/');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchRentals = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/rentals/');
      if (res.ok) {
        const data = await res.json();
        setAllRentals(data);
      }
    } catch (err) {
      console.error("Failed to fetch rentals:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/complaints/?admin=true');
      if (res.ok) {
        const data = await res.json();
        setComplaintsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    }
  };

  const fetchKyc = async () => {
    try {
      setKycLoading(true);
      const res = await fetch('http://localhost:8000/api/admin/kyc/');
      if (res.ok) {
        const data = await res.json();
        setKycList(data.submissions || []);
        setKycStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch KYC records:", err);
    } finally {
      setKycLoading(false);
    }
  };

  const handleUpdateKycStatus = async (userId, newStatus, reason = '') => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/kyc/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejection_reason: reason })
      });
      if (res.ok) {
        await fetchKyc();
        setRejectingKyc(null);
        setRejectionReason('');
        if (inspectingKyc && inspectingKyc.user_id === userId) {
          setInspectingKyc(prev => ({ ...prev, status: newStatus, rejection_reason: reason }));
        }
      }
    } catch (err) {
      console.error("Failed to update KYC status:", err);
    }
  };

  useEffect(() => {
    if (isAdminAuthorized) {
      fetchDashboard();
      fetchInventory();
      fetchUsers();
      fetchRentals();
      fetchComplaints();
      fetchKyc();
    }
  }, [isAdminAuthorized]);

  useEffect(() => {
    if (!isAdminAuthorized) return;

    const socket = getSocket();
    joinAdminRoom();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    if (socket) {
      setSocketConnected(socket.connected);
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      socket.on('order:new', (data) => {
        setLiveAlert({
          type: 'order',
          title: '⚡ New Rental Order Received!',
          text: `Customer ${data.user_name} booked ${data.rentals_count} items (₹${data.amount_total.toLocaleString()}). Invoice: ${data.invoice_number}`
        });
        fetchDashboard();
        fetchRentals();
      });

      socket.on('kyc:submitted', (data) => {
        setLiveAlert({
          type: 'kyc',
          title: '🛡️ New KYC Document Submitted',
          text: `Customer ${data.user_name || 'User'} uploaded credentials for review.`
        });
        fetchKyc();
      });

      socket.on('complaint:created', (data) => {
        setLiveAlert({
          type: 'complaint',
          title: '🎫 New Customer Support Ticket',
          text: `${data.category || 'Quality'} grievance: "${data.subject || 'Ticket filed'}"`
        });
        fetchComplaints();
      });

      socket.on('payout:requested', (data) => {
        setLiveAlert({
          type: 'payout',
          title: '💸 Owner Withdrawal Requested',
          text: `Payout ID: ${data.payout_id} for ₹${data.amount?.toLocaleString()} (Settlement: ${data.utr})`
        });
      });

      socket.on('admin:dispatch_updated', () => {
        fetchRentals();
      });

      socket.on('admin:kyc_reviewed', () => {
        fetchKyc();
      });
    }

    return () => {
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('order:new');
        socket.off('kyc:submitted');
        socket.off('complaint:created');
        socket.off('payout:requested');
        socket.off('admin:dispatch_updated');
        socket.off('admin:kyc_reviewed');
      }
    };
  }, [isAdminAuthorized]);

  useEffect(() => {
    if (liveAlert) {
      const timer = setTimeout(() => setLiveAlert(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [liveAlert]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  // --- Module 2: Appliance Inventory Handlers ---
  const handleSaveAppliance = async (e) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingAppliance);
      const url = isEdit 
        ? `http://localhost:8000/api/appliances/${editingAppliance.appliance_id || editingAppliance._id}/`
        : 'http://localhost:8000/api/appliances/';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...applianceForm,
          appliance_id: editingAppliance?.appliance_id
        })
      });

      if (res.ok) {
        alert(isEdit ? 'Appliance updated successfully!' : 'New appliance added to catalog!');
        setIsAddModalOpen(false);
        setEditingAppliance(null);
        fetchInventory();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to save appliance'}`);
      }
    } catch (err) {
      console.error("Error saving appliance:", err);
    }
  };

  const handleDeleteAppliance = async (appId, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the inventory?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/appliances/${appId}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Appliance removed from catalog.');
        fetchInventory();
      }
    } catch (err) {
      console.error("Error deleting appliance:", err);
    }
  };

  const openEditAppliance = (app) => {
    setEditingAppliance(app);
    setApplianceForm({
      rental_name: app.rental_name || '',
      category_id: app.category_id || 'Appliances',
      sub_category: app.sub_category || 'General',
      brand: app.brand || 'Rentora Select',
      monthly_price: app.monthly_price || 699,
      security_deposit: app.security_deposit || 1049,
      stock_quantity: app.stock_quantity || 10,
      pricing_3: app.pricing?.['3'] || app.monthly_price || 699,
      pricing_6: app.pricing?.['6'] || Math.round(app.monthly_price * 0.9) || 629,
      pricing_12: app.pricing?.['12'] || Math.round(app.monthly_price * 0.8) || 559,
      available_cities: Array.isArray(app.available_cities) ? app.available_cities.join(', ') : 'Hyderabad, Bangalore, Mumbai, Delhi, Pune',
      image_url: app.image_url || '',
      description: app.description || ''
    });
    setIsAddModalOpen(true);
  };

  // --- Module 7: User Management Handlers (Admin, Owner, Customer) ---
  const handleSetUserRole = async (user, targetRole) => {
    if (!window.confirm(`Change ${user.username}'s role to ${targetRole.toUpperCase()}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${user._id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Permanently remove user account "${username}"?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // --- Module 7: Rental Status / Approval Handlers ---
  const handleUpdateRentalStatus = async (rentalId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/rentals/${rentalId}/approve/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchRentals();
        fetchDashboard();
      }
    } catch (err) {
      console.error("Error updating rental status:", err);
    }
  };

  const handleOpenDispatchModal = (rental) => {
    setDispatchModalRental(rental);
    const tracking = rental.delivery_tracking || {};
    setDispatchStage(rental.delivery_status || 'OUT_FOR_DELIVERY');
    setDispatchTechName(tracking.agent_name || 'Rajesh Patil');
    setDispatchTechPhone(tracking.agent_phone || '+91 98450 12891');
    setDispatchVehicle(tracking.vehicle_number || 'KA-01-EL-9284');
    setDispatchOtpInput('');
  };

  const handleSaveDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchModalRental) return;
    setDispatchUpdating(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/rentals/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rental_id: dispatchModalRental._id,
          delivery_stage: dispatchStage,
          agent_name: dispatchTechName,
          agent_phone: dispatchTechPhone,
          vehicle_number: dispatchVehicle,
          entered_otp: dispatchOtpInput.trim() || undefined
        })
      });

      if (res.ok) {
        setDispatchModalRental(null);
        fetchRentals();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update dispatch status');
      }
    } catch (err) {
      console.error('Error updating dispatch:', err);
      alert('Network error updating dispatch');
    } finally {
      setDispatchUpdating(false);
    }
  };

  // --- Module 8: Complaint Resolution Handler ---
  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/${resolvingComplaint.ticket_id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          resolution_notes: resolutionNotes || 'Issue addressed and resolved by customer support manager.'
        })
      });
      if (res.ok) {
        alert(`Ticket ${resolvingComplaint.ticket_id} marked as RESOLVED!`);
        setResolvingComplaint(null);
        setResolutionNotes('');
        fetchComplaints();
      }
    } catch (err) {
      console.error("Error resolving complaint:", err);
    }
  };

  // One-Click Financial & Rental Ledger CSV Export
  const handleExportCSV = (type) => {
    window.open(`http://localhost:8000/api/admin/export/?type=${type}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
        <div style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Loading Rentora Administrative Suite...</div>
      </div>
    );
  }

  const sales = dashboardData.sales_analytics || {};

  // Filtered inventories
  const filteredAppliances = appliances.filter(a => 
    a.rental_name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    a.category_id?.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Filtered users
  const filteredUsers = usersList.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered rentals
  const filteredRentals = allRentals.filter(r => 
    rentalFilter === 'all' ? true : r.status === rentalFilter
  );

  // Filtered complaints
  const filteredComplaints = complaintsList.filter(c => 
    complaintFilter === 'all' ? true : c.status === complaintFilter
  );

  if (!isAdminAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          textAlign: 'center',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#f5f3ff',
            border: '2px solid #ddd6fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.15)'
          }}>
            <Lock size={32} color="#7c3aed" />
          </div>

          <span style={{
            background: '#ede9fe',
            color: '#7c3aed',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.2rem 0.65rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Restricted Enterprise Access
          </span>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.85rem 0 0.4rem' }}>
            Rentora Admin Console
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.75rem', lineHeight: 1.45 }}>
            Access to this console is restricted to authorized operations personnel. Please enter your Administrator Passcode.
          </p>

          <form onSubmit={handleVerifyPasscode}>
            <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
                Admin Security Key
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError('');
                }}
                placeholder="Enter passcode..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${passcodeError ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {passcodeError ? (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.45rem', fontWeight: 600 }}>
                  {passcodeError}
                </p>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.45rem' }}>
                  💡 Demo Passcode: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, color: '#7c3aed' }}>admin123</code>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: '#7c3aed',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {verifying ? <RefreshCw size={18} className="animate-spin" /> : 'Authorize & Unlock Console'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('user_role', 'customer');
                navigate('/');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; }}
            >
              <ArrowLeft size={14} />
              <span>Return to Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '4rem' }}>
      {/* Top Navbar */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div style={{ background: '#e23744', padding: '0.45rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="white" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>
                Rentora <span style={{ color: '#e23744' }}>Admin Control</span>
              </h2>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'overview', label: 'Analytics & Churn', icon: TrendingUp },
                { id: 'inventory', label: `Appliance Inventory (${appliances.length})`, icon: ShoppingBag },
                { id: 'users', label: `Users (${usersList.length})`, icon: Users },
                { id: 'rentals', label: `Bookings (${allRentals.length})`, icon: PackageCheck },
                { id: 'complaints', label: `Support Tickets (${complaintsList.filter(c => c.status === 'OPEN').length} New)`, icon: MessageSquare },
                { id: 'kyc', label: `KYC Moderation (${kycStats.pending > 0 ? `${kycStats.pending} Pending` : kycList.length})`, icon: ShieldCheck }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected ? '#fee2e2' : 'transparent',
                      color: isSelected ? '#dc2626' : '#64748b',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Live WebSocket Status Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              background: socketConnected ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${socketConnected ? '#a7f3d0' : '#fecaca'}`,
              color: socketConnected ? '#059669' : '#dc2626',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: socketConnected ? '#10b981' : '#ef4444',
                boxShadow: socketConnected ? '0 0 8px #10b981' : 'none',
                display: 'inline-block'
              }} />
              <Wifi size={13} />
              <span>{socketConnected ? 'Live Socket Connected' : 'Connecting Socket...'}</span>
            </div>

            <button 
              onClick={() => {
                localStorage.setItem('user_role', 'customer');
                navigate('/');
              }}
              className="nav-action-btn"
              style={{ cursor: 'pointer' }}
              title="Return to consumer storefront"
            >
              <ArrowLeft size={15} />
              <span>Exit to Storefront</span>
            </button>
            <ThemeToggle />
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Real-Time Live Push Notification Banner */}
      {liveAlert && (
        <div style={{
          background: 'linear-gradient(90deg, #0f172a, #1e1b4b)',
          color: '#ffffff',
          padding: '0.85rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          borderBottom: '2px solid #6366f1',
          zIndex: 40,
          position: 'sticky',
          top: '57px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#312e81', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
              <Sparkles size={18} color="#facc15" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', marginRight: '0.5rem' }}>
                {liveAlert.title}:
              </span>
              <span style={{ fontSize: '0.84rem', color: '#c7d2fe' }}>
                {liveAlert.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => setLiveAlert(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <main className="container" style={{ marginTop: '2rem' }}>
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & MARKET ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem', color: '#0f172a' }}>Enterprise Analytics & Churn Retention</h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                  Live rental metrics, store sales insights ({sales.appliance_furniture_records ? `${sales.appliance_furniture_records.toLocaleString()} records` : 'active'}), and ML-driven churn predictions.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleExportCSV('rentals')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.5rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#38bdf8" />
                  <span>Export Rentals</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV('financials')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.5rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#10b981" />
                  <span>Export Financials</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV('churn')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.5rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#f43f5e" />
                  <span>Export Churn</span>
                </button>

                {sales.dataset_name && (
                  <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.45rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PackageCheck size={14} color="#0284c7" />
                    Dataset: <strong>{sales.dataset_name}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Operational KPIs */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <DollarSign size={26} color="#16a34a" />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Gross Rental Revenue</p>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>₹{dashboardData.total_revenue.toLocaleString()}</h3>
                </div>
              </div>
              
              <div className="panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <Package size={26} color="#2563eb" />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Active Customer Leases</p>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>{dashboardData.active_rentals}</h3>
                </div>
              </div>
              
              <div className="panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <AlertTriangle size={26} color="#e23744" />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>At-Risk Churn Profiles</p>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>{dashboardData.at_risk_customers.length}</h3>
                </div>
              </div>

              <div className="panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: '#faf5ff', padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <TrendingUp size={26} color="#9333ea" />
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Market Sales Volume</p>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>
                    {sales.total_sales_volume ? `₹${(sales.total_sales_volume / 10000000).toFixed(1)} Cr` : '₹0'}
                  </h3>
                </div>
              </div>
            </section>

            {/* Interactive MRR & Category Cashflow Analysis (Executive BI via Recharts) */}
            <section className="panel" style={{ padding: '1.75rem', marginBottom: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={20} color="#e23744" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Monthly Recurring Revenue (MRR) & Category Velocity
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                    Live interactive portfolio performance across active leases, auto-renewals, and buyout equity conversions.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                    📈 +24.6% MoM Growth
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
                    🛡️ Escrow Health: 99.4%
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                {/* 1. Interactive AreaChart (MRR Growth) */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      6-Month Revenue Inflow & Lease Trajectory
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Hover for telemetry</span>
                  </div>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { month: 'May', revenue: 48500, activeRentals: 26 },
                        { month: 'Jun', revenue: 64200, activeRentals: 35 },
                        { month: 'Jul', revenue: 82000, activeRentals: 48 },
                        { month: 'Aug', revenue: 99400, activeRentals: 62 },
                        { month: 'Sep', revenue: 122800, activeRentals: 74 },
                        { month: 'Oct (Live)', revenue: Math.max(148500, dashboardData.total_revenue), activeRentals: Math.max(85, dashboardData.active_rentals) }
                      ]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="mrrGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e23744" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#e23744" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? `₹${Number(value).toLocaleString()}` : value,
                            name === 'revenue' ? 'Monthly Revenue' : 'Active Contracts'
                          ]}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#e23744" strokeWidth={2.5} fillOpacity={1} fill="url(#mrrGlow)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Interactive BarChart (Category Revenue Share) */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      Revenue Contribution by Asset Class
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Rentora Fleet</span>
                  </div>
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { category: 'Cooling/Fridges', revenue: 58000, color: '#e23744' },
                        { category: 'Washers', revenue: 38500, color: '#6366f1' },
                        { category: 'Sofas/Living', revenue: 29000, color: '#0284c7' },
                        { category: 'Smart LED TVs', revenue: 16500, color: '#10b981' },
                        { category: 'Purifiers', revenue: 9500, color: '#f59e0b' }
                      ]} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Monthly Inflow']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                          {[
                            { color: '#e23744' },
                            { color: '#6366f1' },
                            { color: '#0284c7' },
                            { color: '#10b981' },
                            { color: '#f59e0b' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 3. Churn Risk Score Distribution (LightGBM) & Regional Sales Benchmarks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                        Customer Churn Probability Spectrum (LightGBM)
                      </span>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Risk segmentation across active user profiles</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                      AI Model 1
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { tier: 'Low (<30%)', count: Math.max(16, usersList.length - dashboardData.at_risk_customers.length), color: '#10b981' },
                        { tier: 'Moderate (30-50%)', count: Math.max(3, dashboardData.at_risk_customers.filter(c => c.churn_risk_score <= 0.65).length), color: '#f59e0b' },
                        { tier: 'High (50-80%)', count: Math.max(4, dashboardData.at_risk_customers.filter(c => c.churn_risk_score > 0.65 && c.churn_risk_score <= 0.85).length), color: '#ea580c' },
                        { tier: 'Critical (>80%)', count: Math.max(3, dashboardData.at_risk_customers.filter(c => c.churn_risk_score > 0.85).length), color: '#e23744' }
                      ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="tier" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip 
                          formatter={(v) => [`${v} Users`, 'Cohort Size']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {[
                            { color: '#10b981' },
                            { color: '#f59e0b' },
                            { color: '#ea580c' },
                            { color: '#e23744' }
                          ].map((entry, index) => (
                            <Cell key={`churn-cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                        Regional Retail Benchmark (Store Sales 100k Dataset)
                      </span>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Sales volume vs Net profit by city tier (in ₹ Lakhs)</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                      Retail Intel
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { tier: 'Tier 1 Metro', sales: 485, profit: 82 },
                        { tier: 'Tier 2 Emerging', sales: 260, profit: 36 },
                        { tier: 'Tier 3 Regional', sales: 110, profit: 14 }
                      ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="tier" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                        <Tooltip 
                          formatter={(v, name) => [`₹${v} Lakhs`, name === 'sales' ? 'Gross Sales' : 'Net Margin']}
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <Bar dataKey="sales" name="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* High Churn Risk Customers Table (LightGBM + SHAP) */}
            <section className="panel" style={{ overflow: 'hidden', marginBottom: '2.5rem' }}>
              <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#0f172a' }}>High Churn Risk Customers (LightGBM & SHAP Insights)</h2>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem', margin: 0 }}>Predictive customer retention scores automatically extracted from behavioral telemetry.</p>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontWeight: 700 }}>
                  AI Model 1 Active
                </span>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Customer Profile</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Churn Probability</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>SHAP Explainability Reason</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Retention Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.at_risk_customers.length > 0 ? (
                      dashboardData.at_risk_customers.map((customer, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 1.5rem' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{customer.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{customer.email}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1.5rem' }}>
                            <div style={{ 
                              display: 'inline-flex', alignItems: 'center', 
                              background: customer.churn_risk_score > 0.8 ? '#fef2f2' : '#fff7ed', 
                              color: customer.churn_risk_score > 0.8 ? '#e23744' : '#ea580c',
                              padding: '0.2rem 0.65rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.8rem'
                            }}>
                              {(customer.churn_risk_score * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1.5rem', color: '#475569' }}>
                            {customer.shap_reason}
                          </td>
                          <td style={{ padding: '0.85rem 1.5rem' }}>
                            <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                              Offer 15% Retention Perk
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                          No customers currently at high risk. Platform health is optimal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: APPLIANCE INVENTORY MANAGEMENT (Module 2) */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', margin: 0, color: '#0f172a' }}>Appliance Inventory Catalog</h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem', margin: 0 }}>
                  Add, update, adjust tenure rental pricing, configure deposits, and manage stock quantities.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search appliances..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '220px' }}
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingAppliance(null);
                    setApplianceForm({
                      rental_name: '',
                      category_id: 'Appliances',
                      sub_category: 'Home Appliances',
                      brand: 'Rentora Select',
                      monthly_price: 699,
                      security_deposit: 1049,
                      stock_quantity: 10,
                      pricing_3: 699,
                      pricing_6: 629,
                      pricing_12: 559,
                      available_cities: 'Hyderabad, Bangalore, Mumbai, Delhi, Pune',
                      image_url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&q=80&w=600',
                      description: 'Energy-efficient appliance with free periodic maintenance and doorstep relocation support.'
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={16} />
                  Add New Appliance
                </button>
              </div>
            </div>

            <div className="panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Item</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Category</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Monthly Rent</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Deposit</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Stock</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Coverage</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppliances.map((app, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img 
                              src={app.image_url || 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&q=80&w=150'} 
                              alt={app.rental_name} 
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{app.rental_name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.brand || 'Rentora Select'} • {app.tag || 'Standard'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                            {app.category_id}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                          ₹{app.monthly_price}/mo
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>
                            6m: ₹{app.pricing?.['6'] || Math.round(app.monthly_price * 0.9)} • 12m: ₹{app.pricing?.['12'] || Math.round(app.monthly_price * 0.8)}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          ₹{app.security_deposit || Math.round(app.monthly_price * 1.5)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ 
                            background: app.stock_quantity > 0 ? '#dcfce7' : '#fee2e2', 
                            color: app.stock_quantity > 0 ? '#15803d' : '#b91c1c',
                            padding: '0.2rem 0.55rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.75rem' 
                          }}>
                            {app.stock_quantity > 0 ? `${app.stock_quantity} in stock` : 'Out of Stock'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                          {Array.isArray(app.available_cities) ? `${app.available_cities.length} cities` : '5 cities'}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditAppliance(app)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '0.35rem 0.55rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAppliance(app.appliance_id || app._id, app.rental_name)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.35rem 0.55rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: USER MANAGEMENT (Module 7) */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', margin: 0, color: '#0f172a' }}>Customer & User Management</h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem', margin: 0 }}>
                  Manage registered accounts, inspect active rental obligations, and manage administrator access.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleExportCSV('users')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.5rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#38bdf8" />
                  <span>Export Users CSV</span>
                </button>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '250px' }}
                  />
                </div>
              </div>
            </div>

            <div className="panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Username & Email</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Phone</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Role</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Active Rentals</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Registered Date</th>
                      <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1.5rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.username}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.5rem', color: '#64748b' }}>
                          {u.phone_num || 'Not provided'}
                        </td>
                        <td style={{ padding: '0.85rem 1.5rem' }}>
                          <span style={{ 
                            background: u.role === 'admin' ? '#fee2e2' : u.role === 'owner' ? '#ecfdf5' : '#eff6ff', 
                            color: u.role === 'admin' ? '#dc2626' : u.role === 'owner' ? '#059669' : '#2563eb',
                            border: `1px solid ${u.role === 'admin' ? '#fca5a5' : u.role === 'owner' ? '#a7f3d0' : '#bfdbfe'}`,
                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.75rem' 
                          }}>
                            {u.role ? u.role.toUpperCase() : 'CUSTOMER'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.5rem' }}>
                          <strong style={{ color: u.active_rentals_count > 0 ? '#16a34a' : '#64748b' }}>
                            {u.active_rentals_count || 0} active
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}> ({u.total_rentals_count || 0} total)</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.5rem', color: '#64748b' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <select
                              value={u.role || 'customer'}
                              onChange={(e) => handleSetUserRole(u, e.target.value)}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#334155',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <option value="customer">Role: Customer</option>
                              <option value="owner">Role: Owner</option>
                              <option value="admin">Role: Admin</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(u._id, u.username)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RENTAL APPROVALS & DISPATCH (Module 7: Approve Rentals) */}
        {/* ========================================================================= */}
        {activeTab === 'rentals' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', margin: 0, color: '#0f172a' }}>Rental Bookings & Dispatch Management</h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem', margin: 0 }}>
                  Approve newly submitted rental requests, assign delivery partners, and track appliance handover status.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleExportCSV('rentals')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.5rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#38bdf8" />
                  <span>Export Bookings CSV</span>
                </button>

                {/* Status Filter buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '8px' }}>
                  {['all', 'active', 'pending_delivery', 'dispatched', 'delivered', 'inactive'].map(st => (
                    <button
                      key={st}
                      onClick={() => setRentalFilter(st)}
                      style={{
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: rentalFilter === st ? 'white' : 'transparent',
                        color: rentalFilter === st ? '#0f172a' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {st.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Order Details</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Customer</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Monthly Fee</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Payment Method</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textAlign: 'right' }}>Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRentals.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.appliance_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tenure: {r.tenure || '3'} months • ID: {r._id.slice(0, 8)}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.customer_email}</div>
                          {r.delivery_address && (
                            <div style={{ 
                              marginTop: '0.35rem', 
                              padding: '0.3rem 0.5rem', 
                              background: '#eff6ff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              fontSize: '0.73rem' 
                            }}>
                              <div style={{ color: '#1e40af', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Truck size={11} />
                                <span>{r.delivery_address.city} - {r.delivery_address.pincode}</span>
                              </div>
                              <div style={{ color: '#475569', fontSize: '0.7rem' }}>
                                {r.delivery_address.house_flat ? `${r.delivery_address.house_flat}, ` : ''}{r.delivery_address.street_area || ''}
                              </div>
                              {r.delivery_address.delivery_slot && (
                                <div style={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', marginTop: '0.15rem' }}>
                                  Slot: {r.delivery_address.delivery_slot}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>
                          ₹{r.monthly_rent}/mo
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>Deposit: ₹{r.security_deposit || 0}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ 
                            background: r.payment_method === 'CASH_ON_DELIVERY' ? '#fef3c7' : '#e0f2fe',
                            color: r.payment_method === 'CASH_ON_DELIVERY' ? '#92400e' : '#0369a1',
                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700
                          }}>
                            {r.payment_method === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : (r.payment_method || 'UPI Gateway')}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ 
                            background: r.status === 'active' || r.status === 'delivered' ? '#dcfce7' : (r.status === 'inactive' ? '#f1f5f9' : '#fff7ed'),
                            color: r.status === 'active' || r.status === 'delivered' ? '#15803d' : (r.status === 'inactive' ? '#64748b' : '#c2410c'),
                            padding: '0.2rem 0.65rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.75rem', display: 'inline-block'
                          }}>
                            {r.status?.toUpperCase()}
                          </span>
                          {r.delivery_status && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>
                              Stage: {r.delivery_status.replace(/_/g, ' ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenDispatchModal(r)}
                              style={{
                                background: '#0f172a',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: 700
                              }}
                            >
                              <Truck size={12} color="#38bdf8" />
                              <span>Logistics & Dispatch</span>
                            </button>

                            {r.status !== 'active' && r.status !== 'delivered' && (
                              <button
                                onClick={() => handleUpdateRentalStatus(r._id, 'active')}
                                style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: COMPLAINTS & SUPPORT (Module 8: Feedback & Complaints) */}
        {/* ========================================================================= */}
        {activeTab === 'complaints' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', margin: 0, color: '#0f172a' }}>Customer Complaints & Ticketing System</h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem', margin: 0 }}>
                  Review customer grievances, appliance repair tickets, billing inquiries, and log administrative resolutions.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleExportCSV('complaints')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.5rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#38bdf8" />
                  <span>Export Complaints CSV</span>
                </button>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '0.4rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '8px' }}>
                  {['all', 'OPEN', 'IN_REVIEW', 'RESOLVED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setComplaintFilter(st)}
                      style={{
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: complaintFilter === st ? 'white' : 'transparent',
                        color: complaintFilter === st ? '#0f172a' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {st.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Ticket Reference</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Customer Profile</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Category & Subject</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Description</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0284c7' }}>
                          {c.ticket_id}
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.customer_email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                            {c.category}
                          </span>
                          <div style={{ fontWeight: 600, marginTop: '0.2rem', color: '#0f172a' }}>{c.subject}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#475569', maxWidth: '280px' }}>
                          {c.description}
                          {c.resolution_notes && (
                            <div style={{ marginTop: '0.35rem', padding: '0.35rem 0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.75rem', color: '#166534' }}>
                              <strong>Resolution:</strong> {c.resolution_notes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span style={{ 
                            background: c.status === 'RESOLVED' ? '#dcfce7' : (c.status === 'OPEN' ? '#fee2e2' : '#fef3c7'),
                            color: c.status === 'RESOLVED' ? '#15803d' : (c.status === 'OPEN' ? '#b91c1c' : '#92400e'),
                            padding: '0.2rem 0.65rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.75rem'
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                          {c.status !== 'RESOLVED' ? (
                            <button
                              onClick={() => {
                                setResolvingComplaint(c);
                                setResolutionNotes('');
                              }}
                              className="btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#16a34a', borderColor: '#16a34a' }}
                            >
                              Resolve Ticket
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                              ✓ Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: KYC IDENTITY & COMPLIANCE MODERATION */}
        {/* ========================================================================= */}
        {activeTab === 'kyc' && (
          <div className="animate-fade-in">
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="panel" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL SUBMISSIONS</span>
                <h3 style={{ fontSize: '1.65rem', margin: '0.35rem 0 0', color: '#0f172a' }}>{kycStats.total}</h3>
              </div>
              <div className="panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>PENDING COMPLIANCE REVIEW</span>
                <h3 style={{ fontSize: '1.65rem', margin: '0.35rem 0 0', color: '#d97706' }}>{kycStats.pending}</h3>
              </div>
              <div className="panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>APPROVED TENANTS</span>
                <h3 style={{ fontSize: '1.65rem', margin: '0.35rem 0 0', color: '#059669' }}>{kycStats.approved}</h3>
              </div>
              <div className="panel" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
                <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>REJECTED / ACTION REQUIRED</span>
                <h3 style={{ fontSize: '1.65rem', margin: '0.35rem 0 0', color: '#dc2626' }}>{kycStats.rejected}</h3>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '8px' }}>
                {[
                  { id: 'all', label: `All (${kycList.length})` },
                  { id: 'in_review', label: `Pending / In Review (${kycStats.pending})` },
                  { id: 'approved', label: `Approved (${kycStats.approved})` },
                  { id: 'rejected', label: `Rejected (${kycStats.rejected})` }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setKycFilter(f.id)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: kycFilter === f.id ? 'white' : 'transparent',
                      color: kycFilter === f.id ? '#0f172a' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => handleExportCSV('kyc')}
                  style={{
                    background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.45rem 0.95rem',
                    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)', transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  <Download size={14} color="#38bdf8" />
                  <span>Export KYC Log CSV</span>
                </button>

                <button
                  onClick={fetchKyc}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={14} className={kycLoading ? 'animate-spin' : ''} />
                  Refresh KYC Queue
                </button>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Tenant Applicant</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Document Type & ID</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Submitted Proofs</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>AI Confidence</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.8rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycList
                      .filter(item => {
                        if (kycFilter === 'all') return true;
                        if (kycFilter === 'in_review') return item.status === 'in_review' || item.status === 'pending';
                        return item.status === kycFilter;
                      })
                      .map((k, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{k.full_name || k.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{k.email}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{k.phone_num}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '0.15rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {k.id_type || 'Aadhaar Card'}
                            </span>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155', marginTop: '0.25rem' }}>
                              {k.id_number || 'UID-3892-4912'}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setInspectingKyc(k)}
                                style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  color: '#334155'
                                }}
                              >
                                <Eye size={12} /> Inspect Docs
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                              {k.confidence_score || '98.5'}% Match
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <span style={{
                              background: k.status === 'approved' ? '#dcfce7' : (k.status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                              color: k.status === 'approved' ? '#15803d' : (k.status === 'rejected' ? '#b91c1c' : '#b45309'),
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              textTransform: 'uppercase'
                            }}>
                              {k.status === 'in_review' ? 'In Review' : k.status}
                            </span>
                            {k.rejection_reason && (
                              <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '0.25rem', maxWidth: '200px' }}>
                                Note: {k.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {k.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateKycStatus(k.user_id, 'approved')}
                                  style={{
                                    background: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Approve tenant identity"
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {k.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingKyc(k);
                                    setRejectionReason('Document image was blurry or address mismatch.');
                                  }}
                                  style={{
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Reject with feedback"
                                >
                                  ✕ Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {kycList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                          No KYC submissions matching filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT APPLIANCE (Module 2) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '640px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsAddModalOpen(false)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', marginBottom: '0.35rem' }}>
              {editingAppliance ? 'Edit Appliance Details' : 'Add New Appliance to Catalog'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Configure product details, multi-tenure pricing, and distribution warehouse stock.
            </p>

            <form onSubmit={handleSaveAppliance} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Appliance Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={applianceForm.rental_name}
                  onChange={(e) => setApplianceForm({ ...applianceForm, rental_name: e.target.value })}
                  placeholder="e.g. Bosch Inverter Front Load Washing Machine (7.5 Kg)"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
                    value={applianceForm.category_id}
                    onChange={(e) => setApplianceForm({ ...applianceForm, category_id: e.target.value })}
                  >
                    <option value="Appliances">Appliances</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Brand Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={applianceForm.brand}
                    onChange={(e) => setApplianceForm({ ...applianceForm, brand: e.target.value })}
                    placeholder="e.g. Samsung, LG, Whirlpool"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Rental Pricing & Deposit Structure
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Base Rent (3m)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={applianceForm.monthly_price}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setApplianceForm({
                          ...applianceForm,
                          monthly_price: p,
                          pricing_3: p,
                          pricing_6: Math.round(p * 0.9),
                          pricing_12: Math.round(p * 0.8),
                          security_deposit: Math.round(p * 1.5)
                        });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>6-Mo Rent</label>
                    <input
                      type="number"
                      className="input-field"
                      value={applianceForm.pricing_6}
                      onChange={(e) => setApplianceForm({ ...applianceForm, pricing_6: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>12-Mo Rent</label>
                    <input
                      type="number"
                      className="input-field"
                      value={applianceForm.pricing_12}
                      onChange={(e) => setApplianceForm({ ...applianceForm, pricing_12: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Deposit (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={applianceForm.security_deposit}
                      onChange={(e) => setApplianceForm({ ...applianceForm, security_deposit: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Stock Quantity</label>
                  <input
                    type="number"
                    className="input-field"
                    value={applianceForm.stock_quantity}
                    onChange={(e) => setApplianceForm({ ...applianceForm, stock_quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Available Cities</label>
                  <input
                    type="text"
                    className="input-field"
                    value={applianceForm.available_cities}
                    onChange={(e) => setApplianceForm({ ...applianceForm, available_cities: e.target.value })}
                    placeholder="Comma separated cities"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Image URL</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="url"
                    className="input-field"
                    value={applianceForm.image_url}
                    onChange={(e) => setApplianceForm({ ...applianceForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    required
                    style={{ flex: 1 }}
                  />
                  {applianceForm.image_url && (
                    <img 
                      src={applianceForm.image_url} 
                      alt="Preview" 
                      style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={applianceForm.description}
                  onChange={(e) => setApplianceForm({ ...applianceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {editingAppliance ? 'Save Changes' : 'Create Appliance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESOLVE COMPLAINT (Module 8) */}
      {/* ========================================================================= */}
      {resolvingComplaint && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setResolvingComplaint(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              Resolve Ticket {resolvingComplaint.ticket_id}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              <strong>Issue:</strong> {resolvingComplaint.subject} ({resolvingComplaint.customer_name})
            </p>

            <form onSubmit={handleResolveComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Official Resolution Notes</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Detail the steps taken (e.g. Technician dispatched, deposit fee refunded, delivery slot confirmed)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.75rem', background: '#16a34a', borderColor: '#16a34a' }}
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT KYC DOCUMENTS */}
      {/* ========================================================================= */}
      {inspectingKyc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '640px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setInspectingKyc(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={20} color="#7c3aed" />
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>
                KYC Dossier: {inspectingKyc.full_name || inspectingKyc.username}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Submitted on {inspectingKyc.submitted_at ? new Date(inspectingKyc.submitted_at).toLocaleString() : 'Recently Submitted'}
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>DOCUMENT TYPE</span>
                  <strong>{inspectingKyc.id_type || 'Aadhaar Card'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>DOCUMENT NUMBER</span>
                  <strong style={{ fontFamily: 'monospace' }}>{inspectingKyc.id_number}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>RESIDENTIAL ADDRESS</span>
                  <strong>{inspectingKyc.address_line || 'Verified Doorstep Address'}</strong>
                </div>
              </div>
            </div>

            {/* Document Previews */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Front of Government ID
                </span>
                {inspectingKyc.id_proof_preview && inspectingKyc.id_proof_preview.startsWith('data:') ? (
                  <img
                    src={inspectingKyc.id_proof_preview}
                    alt="ID Document"
                    style={{ width: '100%', height: '140px', objectFit: 'contain', background: '#f1f5f9', borderRadius: '6px' }}
                  />
                ) : (
                  <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '0.5rem' }}>
                    <FileText size={32} color="#94a3b8" />
                    <span style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>{inspectingKyc.id_proof_name || 'ID_Front.jpg'}</span>
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Address Proof (Utility Bill)
                </span>
                {inspectingKyc.address_proof_preview && inspectingKyc.address_proof_preview.startsWith('data:') ? (
                  <img
                    src={inspectingKyc.address_proof_preview}
                    alt="Address Document"
                    style={{ width: '100%', height: '140px', objectFit: 'contain', background: '#f1f5f9', borderRadius: '6px' }}
                  />
                ) : (
                  <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '0.5rem' }}>
                    <FileText size={32} color="#94a3b8" />
                    <span style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>{inspectingKyc.address_proof_name || 'Address_Bill.pdf'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions inside modal */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setInspectingKyc(null)}
                style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = inspectingKyc;
                  setInspectingKyc(null);
                  setRejectingKyc(target);
                  setRejectionReason('Document image was blurry or address mismatch.');
                }}
                style={{ flex: 1, padding: '0.75rem', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                ✕ Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateKycStatus(inspectingKyc.user_id, 'approved');
                  setInspectingKyc(null);
                }}
                style={{ flex: 1, padding: '0.75rem', background: '#16a34a', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                ✓ Approve Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT KYC WITH REASON */}
      {/* ========================================================================= */}
      {rejectingKyc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1350,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setRejectingKyc(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#b91c1c', marginBottom: '0.35rem' }}>
              Reject KYC Submission
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Applicant: <strong>{rejectingKyc.full_name || rejectingKyc.username}</strong> ({rejectingKyc.email})
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateKycStatus(rejectingKyc.user_id, 'rejected', rejectionReason);
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
                  Rejection Reason / Tenant Feedback *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this was rejected (e.g. Utility bill expired, ID photo too blurry, name mismatch)..."
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>Quick Presets:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    'Blurry or unreadable photo',
                    'Address proof older than 90 days',
                    'ID name does not match account name',
                    'Document expired'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      style={{ fontSize: '0.72rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectingKyc(null)}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#dc2626', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH & LOGISTICS MODAL */}
      {dispatchModalRental && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#eff6ff', padding: '0.45rem', borderRadius: '8px' }}>
                  <Truck size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                    Logistics & Dispatch Management
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Subscription #{dispatchModalRental._id.slice(0, 8)} • {dispatchModalRental.customer_name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalRental(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Destination Info */}
            {dispatchModalRental.delivery_address && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                  📍 {dispatchModalRental.delivery_address.house_flat}, {dispatchModalRental.delivery_address.street_area} ({dispatchModalRental.delivery_address.city} - {dispatchModalRental.delivery_address.pincode})
                </div>
                <div style={{ color: '#0284c7', fontWeight: 600 }}>
                  Scheduled Window: {dispatchModalRental.delivery_address.delivery_slot || 'Express'}
                </div>
                <div style={{ color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                  Customer Handover OTP: <span style={{ fontFamily: 'monospace' }}>{dispatchModalRental.delivery_tracking?.delivery_otp || '4829'}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Delivery Pipeline Stage *
                </label>
                <select
                  value={dispatchStage}
                  onChange={(e) => setDispatchStage(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="QUALITY_CHECK">Quality Check & 28-Point Sanitization</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery & Doorstep Assembly</option>
                  <option value="DELIVERED">Delivered, Assembled & Handover Done</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Assigned Field Technician
                  </label>
                  <input
                    type="text"
                    value={dispatchTechName}
                    onChange={(e) => setDispatchTechName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Technician Phone (+91)
                  </label>
                  <input
                    type="text"
                    value={dispatchTechPhone}
                    onChange={(e) => setDispatchTechPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Delivery Vehicle Reg. Number
                </label>
                <input
                  type="text"
                  value={dispatchVehicle}
                  onChange={(e) => setDispatchVehicle(e.target.value)}
                  placeholder="e.g. KA-01-EL-9284"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {dispatchStage === 'DELIVERED' && (
                <div style={{ background: '#f0fdf4', border: '1.5px dashed #86efac', borderRadius: '8px', padding: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '0.35rem' }}>
                    Verify Customer Handover OTP (Optional or enter to confirm)
                  </label>
                  <input
                    type="text"
                    value={dispatchOtpInput}
                    onChange={(e) => setDispatchOtpInput(e.target.value)}
                    placeholder="Enter 4-digit OTP from customer (e.g. 4829)"
                    maxLength={4}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #86efac', fontSize: '0.9rem', fontFamily: 'monospace' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDispatchModalRental(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchUpdating}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: dispatchUpdating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {dispatchUpdating ? 'Saving Dispatch...' : 'Update Dispatch & Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
