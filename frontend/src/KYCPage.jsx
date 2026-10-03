import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  UploadCloud, 
  ArrowRight, 
  Loader2, 
  Home as HomeIcon, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Zap, 
  ShieldAlert, 
  X, 
  FileCheck, 
  ChevronLeft,
  Clock,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Sparkles,
  CreditCard,
  UserCheck,
  Building,
  ScanLine
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import ThemeToggle from './ThemeToggle';

const ID_TYPES = [
  { id: 'Aadhaar Card', label: 'Aadhaar Card', placeholder: '12-digit UID (e.g. 5482 9102 3841)', pattern: '^[0-9]{12}$' },
  { id: 'Driving License', label: 'Driving License', placeholder: 'e.g. DL-1420110012345', pattern: '^[A-Z0-9-]{10,16}$' },
  { id: 'Passport', label: 'Passport', placeholder: '8-character alphanumeric (e.g. Z1234567)', pattern: '^[A-Z0-9]{8,9}$' },
  { id: 'Voter ID', label: 'Voter ID Card', placeholder: 'e.g. ABC1234567', pattern: '^[A-Z0-9]{10}$' }
];

const KYCPage = () => {
  const navigate = useNavigate();

  // Verification Data state
  const [initialLoading, setInitialLoading] = useState(true);
  const [kycData, setKycData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [verificationMode, setVerificationMode] = useState('instant'); // 'instant' | 'manual'

  // Files & Previews
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [addressPreview, setAddressPreview] = useState(null);

  // UI state
  const [idDragOver, setIdDragOver] = useState(false);
  const [addressDragOver, setAddressDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0 = idle, 1 = OCR scan, 2 = fraud check, 3 = complete

  const idInputRef = useRef(null);
  const addressInputRef = useRef(null);

  const fetchCurrentKyc = async () => {
    try {
      setInitialLoading(true);
      const res = await fetchWithAuth('http://localhost:8000/api/kyc/');
      if (res.ok) {
        const data = await res.json();
        setKycData(data);
        if (data.status === 'pending' || data.status === 'rejected') {
          setIsEditing(true);
          if (data.full_name) setFullName(data.full_name);
          if (data.id_type) setIdType(data.id_type);
          if (data.id_number) setIdNumber(data.id_number);
          if (data.address_line) setAddressLine(data.address_line);
        } else {
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error('Failed to load KYC state:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentKyc();
  }, []);

  const handleIdFileSelect = (file) => {
    if (!file) return;
    setIdFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setIdPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAddressFileSelect = (file) => {
    if (!file) return;
    setAddressFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAddressPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name as it appears on your document.');
      return;
    }
    if (!idNumber.trim()) {
      setErrorMessage('Please enter your Government Document / ID number.');
      return;
    }
    if (!idPreview && !idFile) {
      setErrorMessage('Please upload the front photo of your Government ID.');
      return;
    }
    if (!addressPreview && !addressFile) {
      setErrorMessage('Please upload an address proof document (Utility Bill or Rental Agreement).');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);
    setScanStep(1);

    // Simulated multi-step AI OCR & compliance scan
    setTimeout(() => {
      setScanStep(2);
      setTimeout(async () => {
        setScanStep(3);
        try {
          const payload = {
            full_name: fullName.trim(),
            id_type: idType,
            id_number: idNumber.trim(),
            address_line: addressLine.trim() || 'Doorstep Delivery Address',
            id_proof_name: idFile?.name || 'government_id.png',
            id_proof_preview: idPreview || '',
            address_proof_name: addressFile?.name || 'address_proof.png',
            address_proof_preview: addressPreview || '',
            verification_mode: verificationMode
          };

          const res = await fetchWithAuth('http://localhost:8000/api/kyc/', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const result = await res.json();
            setKycData(result.kyc || { ...payload, status: result.status });
            setIsEditing(false);
            if (result.status === 'approved') {
              setTimeout(() => {
                navigate('/cart');
              }, 2000);
            }
          } else {
            const err = await res.json().catch(() => ({}));
            setErrorMessage(err.error || 'KYC submission failed. Please verify your details.');
          }
        } catch (error) {
          console.error('KYC submission error:', error);
          setErrorMessage('Network connection error. Please try again.');
        } finally {
          setSubmitting(false);
          setScanStep(0);
        }
      }, 900);
    }, 900);
  };

  const maskIdNumber = (num) => {
    if (!num) return 'XXXX-XXXX-XXXX';
    const clean = num.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    return '•'.repeat(Math.max(0, clean.length - 4)) + ' ' + clean.slice(-4);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.875rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '0.5rem',
              borderRadius: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)'
            }}>
              <HomeIcon size={20} color="white" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Rent<span style={{ color: '#ef4444' }}>ora</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <Link to="/cart" className="nav-action-btn" style={{ cursor: 'pointer' }}>
              <ChevronLeft size={16} /> Return to Cart
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.02)',
          maxWidth: '740px',
          width: '100%',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Accent Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #10b981 100%)'
          }} />

          {initialLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <Loader2 className="animate-spin" size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading KYC verification records...</p>
            </div>
          ) : !isEditing && kycData?.status === 'approved' ? (
            /* ========================================================
               STATE 1: VERIFIED & APPROVED
               ======================================================== */
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.25s ease' }}>
              <div style={{
                width: '84px',
                height: '84px',
                background: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 10px 25px rgba(22, 163, 74, 0.25)',
                border: '4px solid #bbf7d0'
              }}>
                <CheckCircle2 color="#16a34a" size={48} />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#f0fdf4',
                color: '#15803d',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                border: '1px solid #bbf7d0'
              }}>
                <ShieldCheck size={16} /> Official Verified Tenant
              </div>

              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                Identity Fully Approved!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
                Your government document verification is active. You are cleared to rent any high-value appliances with ₹0 extra deposit penalty.
              </p>

              {/* Verified Identity Card */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem 1.5rem',
                textAlign: 'left',
                marginBottom: '1.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ background: '#ede9fe', padding: '0.45rem', borderRadius: '0.5rem' }}>
                      <CreditCard size={18} color="#7c3aed" />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>DOCUMENT TYPE</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{kycData.id_type || 'Aadhaar Card'}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>IDENTIFIER</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                      {maskIdNumber(kycData.id_number)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>LEGAL NAME</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{kycData.full_name || 'Verified Customer'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>AI FRAUD RISK</span>
                    <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem' }}>
                      Low Risk (99.4% Match)
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>STATUS</span>
                    <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Check size={14} /> Clear to Rent
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Continue to Cart & Checkout <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RefreshCw size={15} /> Update Documents
                </button>
              </div>
            </div>
          ) : !isEditing && kycData?.status === 'in_review' ? (
            /* ========================================================
               STATE 2: UNDER REVIEW BY COMPLIANCE
               ======================================================== */
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.25s ease' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#fef3c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.2)',
                border: '4px solid #fde68a'
              }}>
                <Clock color="#d97706" size={42} />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#fffbeb',
                color: '#b45309',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                border: '1px solid #fde68a'
              }}>
                <Clock size={16} /> Compliance Review In Progress
              </div>

              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                Documents Under Review
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
                Your documents have been submitted to Rentora Compliance. Our automated checks and ops team are reviewing them.
              </p>

              {/* Progress Steps */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} color="#16a34a" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>1. Submission Received</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>ID and address proofs uploaded successfully.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" size={16} color="#d97706" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>2. Document Authenticity & Address Match</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Cross-referencing address proofs against delivery zone.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={16} color="#94a3b8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.88rem', color: '#94a3b8' }}>3. Verified Tenant Badge Grant</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Unlock checkout and instant dispatch.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={fetchCurrentKyc}
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '0.8rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <RefreshCw size={16} /> Refresh Status
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    padding: '0.8rem 1.25rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Resubmit Different Documents
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================
               STATE 3: FORM ENTRY (PENDING, REJECTED, OR EDITING)
               ======================================================== */
            <>
              {/* Header Title */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '2rem',
                  marginBottom: '0.85rem'
                }}>
                  <ShieldCheck size={16} color="#ef4444" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Government KYC & Identity Verification
                  </span>
                </div>

                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                  Verify Your Tenant Identity
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                  To ensure safety across appliance rentals and qualify for ₹0 extra security deposit, upload your government-issued ID and current address proof.
                </p>
              </div>

              {/* Rejection Alert Banner if previously rejected */}
              {kycData?.status === 'rejected' && (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#991b1b', display: 'block', marginBottom: '0.2rem' }}>
                      Previous Submission Action Required
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: 0, lineHeight: 1.45 }}>
                      <strong>Reason from Compliance Team:</strong> {kycData.rejection_reason || 'Document was blurry or address mismatch. Please upload a clear photo of your ID and a recent electricity/utility bill.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                background: '#f8fafc',
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Lock size={15} color="#64748b" /> 256-Bit SSL Encrypted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Zap size={15} color="#eab308" /> AI Fast-Track OCR Check
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                  <ShieldCheck size={15} color="#16a34a" /> 100% Data Privacy Protected
                </div>
              </div>

              {errorMessage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem'
                }}>
                  <ShieldAlert size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* 1. Full Legal Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    1. Full Legal Name (As on Government ID) *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 2. Document Type Selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                    2. Select Government ID Type *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    {ID_TYPES.map((t) => {
                      const isSelected = idType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setIdType(t.id);
                            setIdNumber('');
                          }}
                          style={{
                            background: isSelected ? '#fee2e2' : '#ffffff',
                            border: `1.5px solid ${isSelected ? '#ef4444' : '#e2e8f0'}`,
                            color: isSelected ? '#b91c1c' : '#334155',
                            padding: '0.65rem 0.75rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Document ID Number */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    3. {idType} Number *
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={ID_TYPES.find(t => t.id === idType)?.placeholder || 'Enter ID number...'}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 4. Residential Address */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    4. Current Residential Address *
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Apartment, Street name, City, Pincode"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 5. Document Upload Section (Front ID & Address Proof) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  {/* ID Front Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                      5. Front of {idType} *
                    </label>
                    <input
                      type="file"
                      ref={idInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf"
                      onChange={(e) => handleIdFileSelect(e.target.files[0])}
                    />

                    {idPreview ? (
                      <div style={{
                        border: '1.5px solid #bbf7d0',
                        background: '#f0fdf4',
                        borderRadius: '0.875rem',
                        padding: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <img 
                          src={idPreview} 
                          alt="ID preview" 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #86efac' }} 
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {idFile?.name || 'Government_ID_Front.jpg'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#15803d' }}>Ready for OCR scan</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setIdFile(null); setIdPreview(null); }}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => idInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIdDragOver(true); }}
                        onDragLeave={() => setIdDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIdDragOver(false);
                          if (e.dataTransfer.files?.[0]) handleIdFileSelect(e.dataTransfer.files[0]);
                        }}
                        style={{
                          border: idDragOver ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                          background: idDragOver ? '#fff5f5' : '#f8fafc',
                          borderRadius: '0.875rem',
                          padding: '1.25rem 1rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <UploadCloud size={24} color="#ef4444" style={{ margin: '0 auto 0.4rem' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block' }}>
                          Upload Front of ID
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG or PDF</span>
                      </div>
                    )}
                  </div>

                  {/* Address Proof Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                      6. Address Proof (Utility Bill / Agreement) *
                    </label>
                    <input
                      type="file"
                      ref={addressInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf"
                      onChange={(e) => handleAddressFileSelect(e.target.files[0])}
                    />

                    {addressPreview ? (
                      <div style={{
                        border: '1.5px solid #bbf7d0',
                        background: '#f0fdf4',
                        borderRadius: '0.875rem',
                        padding: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <img 
                          src={addressPreview} 
                          alt="Address preview" 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #86efac' }} 
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {addressFile?.name || 'Address_Proof.pdf'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#15803d' }}>Ready for verification</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setAddressFile(null); setAddressPreview(null); }}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => addressInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setAddressDragOver(true); }}
                        onDragLeave={() => setAddressDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setAddressDragOver(false);
                          if (e.dataTransfer.files?.[0]) handleAddressFileSelect(e.dataTransfer.files[0]);
                        }}
                        style={{
                          border: addressDragOver ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                          background: addressDragOver ? '#fff5f5' : '#f8fafc',
                          borderRadius: '0.875rem',
                          padding: '1.25rem 1rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <UploadCloud size={24} color="#ef4444" style={{ margin: '0 auto 0.4rem' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block' }}>
                          Upload Address Proof
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Electricity, Gas, or Rent Doc</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Verification Mode Selector */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={18} color="#f59e0b" />
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Verification Method</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      Recommended
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setVerificationMode('instant')}
                      style={{
                        flex: 1,
                        background: verificationMode === 'instant' ? '#ffffff' : 'transparent',
                        border: `1.5px solid ${verificationMode === 'instant' ? '#ef4444' : '#cbd5e1'}`,
                        borderRadius: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Instant AI Approval</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Automated document scan & immediate clearance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationMode('manual')}
                      style={{
                        flex: 1,
                        background: verificationMode === 'manual' ? '#ffffff' : 'transparent',
                        border: `1.5px solid ${verificationMode === 'manual' ? '#ef4444' : '#cbd5e1'}`,
                        borderRadius: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Standard Ops Review</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reviewed manually by Admin Compliance</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button with Scanning Simulation */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: submitting 
                      ? '#64748b' 
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.875rem',
                    padding: '1.1rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    boxShadow: submitting 
                      ? 'none' 
                      : '0 10px 20px -3px rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {scanStep === 1 && 'Running OCR Optical Text Extraction...'}
                      {scanStep === 2 && 'Verifying ID Checksum & Anti-Fraud Database...'}
                      {scanStep === 3 && 'Finalizing Verification Certificate...'}
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} />
                      Submit & Verify Documents
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        color: '#94a3b8',
        fontSize: '0.8rem',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff'
      }}>
        © 2026 Rentora Technologies Inc. All customer documents are handled strictly according to data governance laws and processed with AES-256 encryption.
      </footer>
    </div>
  );
};

export default KYCPage;
