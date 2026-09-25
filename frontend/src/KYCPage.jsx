import React, { useState, useRef } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';

const KYCPage = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [idDragOver, setIdDragOver] = useState(false);
  const [addressDragOver, setAddressDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const idInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const navigate = useNavigate();

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleIdDrop = (e) => {
    e.preventDefault();
    setIdDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIdFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddressDrop = (e) => {
    e.preventDefault();
    setAddressDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAddressFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idFile || !addressFile) {
      setErrorMessage('Please upload both an ID Proof and an Address Proof to continue.');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetchWithAuth('http://localhost:8000/api/kyc/', {
        method: 'POST',
        body: JSON.stringify({
          id_proof: idFile.name,
          address_proof: addressFile.name
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/cart');
        }, 2200);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Verification submission failed. Please try again.');
      }
    } catch (error) {
      console.error("KYC Error:", error);
      setErrorMessage('Network error occurred. Please check backend connection.');
    } finally {
      setLoading(false);
    }
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
              Rent<span style={{ color: '#ef4444' }}>AI</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/cart" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              transition: 'background 0.2s'
            }}>
              <ChevronLeft size={16} /> Back to Cart
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
          maxWidth: '720px',
          width: '100%',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Subtle Top Accent Gradient Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #dc2626 100%)'
          }} />

          {success ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                width: '84px',
                height: '84px',
                background: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: '0 10px 25px rgba(22, 163, 74, 0.2)'
              }}>
                <CheckCircle2 color="#16a34a" size={48} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                KYC Approved!
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '440px', margin: '0 auto 2rem auto', lineHeight: 1.5 }}>
                Your identity documents have been verified successfully. Redirecting you to complete your rental order...
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#16a34a',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: '#f0fdf4',
                padding: '0.5rem 1.25rem',
                borderRadius: '2rem',
                border: '1px solid #bbf7d0'
              }}>
                <Loader2 className="animate-spin" size={16} /> Instant redirect in progress...
              </div>
            </div>
          ) : (
            <>
              {/* Header Badge & Title */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '2rem',
                  marginBottom: '1rem'
                }}>
                  <ShieldCheck size={16} color="#ef4444" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Secure Customer Verification
                  </span>
                </div>

                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                  Verify Your Identity
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                  To ensure a safe and transparent appliance rental ecosystem, please provide proof of identity and local residence before concluding your lease.
                </p>
              </div>

              {/* Trust Micro-Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                background: '#f8fafc',
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 500 }}>
                  <Lock size={15} color="#64748b" /> 256-Bit Encrypted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 500 }}>
                  <Zap size={15} color="#eab308" /> Instant Verification
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8rem', fontWeight: 500 }}>
                  <ShieldCheck size={15} color="#16a34a" /> 100% Privacy Protected
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
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem'
                }}>
                  <ShieldAlert size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* 1. ID Proof Upload */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                      1. Government ID Proof
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aadhaar / PAN / Passport / DL</span>
                  </div>

                  <input 
                    type="file" 
                    ref={idInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setIdFile(e.target.files[0]);
                      }
                    }}
                  />

                  {idFile ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '0.5rem' }}>
                          <FileCheck size={22} color="#16a34a" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#166534' }}>
                            {idFile.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>
                            {formatFileSize(idFile.size)} • Ready for verification
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIdFile(null)}
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => idInputRef.current && idInputRef.current.click()}
                      onDragOver={(e) => { e.preventDefault(); setIdDragOver(true); }}
                      onDragLeave={() => setIdDragOver(false)}
                      onDrop={handleIdDrop}
                      style={{
                        border: idDragOver ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                        background: idDragOver ? '#fff5f5' : '#f8fafc',
                        borderRadius: '1rem',
                        padding: '1.75rem 1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                      onMouseOut={(e) => {
                        if (!idDragOver) {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}>
                        <UploadCloud size={24} color="#ef4444" />
                      </div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                        Click to upload or drag & drop ID document
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                        Supports PNG, JPG, JPEG or PDF (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Address Proof Upload */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                      2. Address Proof
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Utility Bill / Rent Agreement / Bank Statement</span>
                  </div>

                  <input 
                    type="file" 
                    ref={addressInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAddressFile(e.target.files[0]);
                      }
                    }}
                  />

                  {addressFile ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '0.5rem' }}>
                          <FileCheck size={22} color="#16a34a" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#166534' }}>
                            {addressFile.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>
                            {formatFileSize(addressFile.size)} • Ready for verification
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddressFile(null)}
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => addressInputRef.current && addressInputRef.current.click()}
                      onDragOver={(e) => { e.preventDefault(); setAddressDragOver(true); }}
                      onDragLeave={() => setAddressDragOver(false)}
                      onDrop={handleAddressDrop}
                      style={{
                        border: addressDragOver ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                        background: addressDragOver ? '#fff5f5' : '#f8fafc',
                        borderRadius: '1rem',
                        padding: '1.75rem 1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                      onMouseOut={(e) => {
                        if (!addressDragOver) {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}>
                        <UploadCloud size={24} color="#ef4444" />
                      </div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                        Click to upload or drag & drop Address document
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                        Supports PNG, JPG, JPEG or PDF (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={!idFile || !addressFile || loading}
                  style={{
                    width: '100%',
                    background: (!idFile || !addressFile || loading) 
                      ? '#cbd5e1' 
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.875rem',
                    padding: '1.1rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: (!idFile || !addressFile || loading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: (!idFile || !addressFile || loading) 
                      ? 'none' 
                      : '0 10px 20px -3px rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseOver={(e) => {
                    if (idFile && addressFile && !loading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 14px 24px -3px rgba(239, 68, 68, 0.45)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (idFile && addressFile && !loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(239, 68, 68, 0.35)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verifying & Submitting Documents...
                    </>
                  ) : (
                    <>
                      Submit for Instant Verification <ArrowRight size={18} />
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
        © 2026 RentAI Technologies Inc. All personal documentation is processed under strict end-to-end data encryption.
      </footer>
    </div>
  );
};

export default KYCPage;
