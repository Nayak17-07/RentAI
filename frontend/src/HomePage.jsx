import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  Sparkles, 
  Loader2, 
  ShoppingCart, 
  Check, 
  MapPin, 
  Search, 
  X, 
  Heart, 
  Truck, 
  ChevronDown, 
  ChevronRight, 
  Headphones, 
  Phone, 
  MessageSquare,
  ArrowUpRight,
  Filter,
  Package
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import CitySelectionModal from './CitySelectionModal';
import ProductDetailsModal from './ProductDetailsModal';
import { CategoryIcon } from './CategoryIcons';
import { AssuranceBanner } from './AssuranceBanner';
import { RentVsBuyCalculator } from './RentVsBuyCalculator';

const TOP_CATEGORIES = [
  { name: "Packages", query: "Package", category: "Packages" },
  { name: "Water Purifiers", query: "Purifier", category: "Appliances" },
  { name: "Beds", query: "Bed", category: "Bedroom" },
  { name: "Sofas", query: "Sofa", category: "Living Room" },
  { name: "Mattresses", query: "Mattress", category: "Bedroom" },
  { name: "Wardrobe & Organizer", query: "Wardrobe", category: "Bedroom" },
  { name: "Refrigerators & Freezers", query: "Refrigerator", category: "Appliances" },
  { name: "Televisions", query: "TV", category: "Appliances" },
  { name: "Washing Machines", query: "Washing Machine", category: "Appliances" },
  { name: "Air Conditioners", query: "Air Conditioner", category: "Appliances" },
  { name: "Chairs & Stools", query: "Chair", category: "Living Room" },
  { name: "Study Tables", query: "Study Table", category: "Living Room" },
  { name: "Center Tables", query: "Coffee Table", category: "Living Room" },
  { name: "Bedside Tables", query: "Side Table", category: "Bedroom" },
  { name: "Chest of Drawers", query: "Drawer", category: "Bedroom" },
  { name: "Microwaves", query: "Microwave", category: "Appliances" },
];

const MAIN_CATEGORIES = [
  "Packages",
  "Furniture",
  "Appliances",
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Electronics",
  "All"
];

const SUB_CATEGORY_ICONS = [
  { name: "Refrigerators", query: "Refrigerator" },
  { name: "Washing Machines", query: "Washing Machine" },
  { name: "Water Purifiers", query: "Purifier" },
  { name: "Air Conditioners", query: "Air Conditioner" },
  { name: "Televisions", query: "TV" },
  { name: "Microwaves", query: "Microwave" },
  { name: "Sofas", query: "Sofa" },
  { name: "Beds", query: "Bed" },
  { name: "Chairs & Stools", query: "Chair" },
  { name: "Tables", query: "Table" },
];

const HomePage = ({ onLogout }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});
  const [wishlist, setWishlist] = useState({});
  const [cartCount, setCartCount] = useState(0);
  
  // City
  const [city, setCity] = useState(localStorage.getItem('rentai_city') || 'Hyderabad');
  const [showCityModal, setShowCityModal] = useState(!localStorage.getItem('rentai_city'));

  // Filters & State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Appliances");
  const [activeSubCategory, setActiveSubCategory] = useState("Washing Machines");
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState({ inStock: true, outOfStock: false });
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [helpOpen, setHelpOpen] = useState(false);

  const navigate = useNavigate();

  const fetchData = async (selectedCity) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      // Recommendations
      const recRes = await fetchWithAuth('http://localhost:8000/api/recommendations/');
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
      
      // Catalog
      const cityQuery = selectedCity ? `?city=${selectedCity}` : '';
      const appRes = await fetch(`http://localhost:8000/api/appliances/${cityQuery}`);
      if (appRes.ok) {
        const appData = await appRes.json();
        setAppliances(appData);
      }

      // Cart count
      const cartRes = await fetchWithAuth('http://localhost:8000/api/cart/');
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCartCount(Array.isArray(cartData) ? cartData.length : 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (city) {
      fetchData(city);
    } else {
      setLoading(false);
    }
  }, [city, navigate]);

  const handleCitySelect = (selected) => {
    localStorage.setItem('rentai_city', selected);
    setCity(selected);
    setShowCityModal(false);
    fetchData(selected);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const addToCart = async (applianceId, tenure = "3") => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/cart/', {
        method: 'POST',
        body: JSON.stringify({ appliance_id: applianceId, tenure: tenure })
      });
      if (res.ok) {
        setAddedItems(prev => ({ ...prev, [applianceId]: true }));
        setCartCount(c => c + 1);
        setSelectedProduct(null);
        setTimeout(() => {
          setAddedItems(prev => ({ ...prev, [applianceId]: false }));
        }, 2000);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const toggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCategoryTileClick = (cat) => {
    setSelectedCategory(cat.category);
    setActiveSubCategory(cat.name);
    setSearchQuery(cat.query);
    const catalog = document.getElementById('catalog-listing-section');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubCategoryClick = (sub) => {
    setActiveSubCategory(sub.name);
    setSearchQuery(sub.query);
    const catalog = document.getElementById('catalog-listing-section');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter logic
  const filteredAppliances = appliances.filter(app => {
    // 1. Category Filter
    if (selectedCategory !== "All") {
      if (selectedCategory === "Furniture") {
        const furnCats = ["living room", "bedroom", "dining room", "office"];
        if (!furnCats.includes(app.category_id?.toLowerCase())) return false;
      } else if (app.category_id?.toLowerCase() !== selectedCategory.toLowerCase()) {
        if (!searchQuery && !activeSubCategory) return false;
      }
    }

    // 2. Search / Sub-Category Query
    const activeQuery = (searchQuery || "").toLowerCase().trim();
    if (activeQuery) {
      const name = (app.rental_name || "").toLowerCase();
      const cat = (app.category_id || "").toLowerCase();
      const sub = (app.sub_category || "").toLowerCase();
      const desc = (app.description || "").toLowerCase();
      const match = name.includes(activeQuery) || cat.includes(activeQuery) || sub.includes(activeQuery) || desc.includes(activeQuery);
      if (!match) return false;
    }

    // 3. Stock Status
    const inStock = (app.stock_quantity || 0) > 0;
    if (statusFilter.inStock && !statusFilter.outOfStock && !inStock) return false;
    if (statusFilter.outOfStock && !statusFilter.inStock && inStock) return false;

    // 4. Budget
    const price = app.monthly_price || 0;
    if (budgetFilter === '0-500' && (price > 500)) return false;
    if (budgetFilter === '501-1000' && (price < 501 || price > 1000)) return false;
    if (budgetFilter === '1001-5000' && (price < 1001 || price > 5000)) return false;
    if (budgetFilter === '5001+' && (price < 501)) return false;

    return true;
  });

  // Calculate budget filter counts
  const count0_500 = appliances.filter(a => (a.monthly_price || 0) <= 500).length;
  const count501_1000 = appliances.filter(a => (a.monthly_price || 0) > 500 && (a.monthly_price || 0) <= 1000).length;
  const count1001_5000 = appliances.filter(a => (a.monthly_price || 0) > 1000 && (a.monthly_price || 0) <= 5000).length;
  const count5001_plus = appliances.filter(a => (a.monthly_price || 0) > 5000).length;
  const inStockCount = appliances.filter(a => (a.stock_quantity || 0) > 0).length;
  const outOfStockCount = appliances.filter(a => (a.stock_quantity || 0) <= 0).length;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={44} color="var(--primary-color)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: '#1f2937', paddingBottom: '5rem', position: 'relative' }}>
      
      {/* City Selection Modal */}
      <CitySelectionModal 
        isOpen={showCityModal} 
        onClose={() => setShowCityModal(false)} 
        onCitySelect={handleCitySelect}
        currentCity={city}
      />

      {/* Product Details / Tenure Modal */}
      {selectedProduct && (
        <ProductDetailsModal 
          appliance={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart} 
        />
      )}

      {/* ========================================================
          1. TOP NAVIGATION BAR (Clean, Polished RentoMojo Style)
          ======================================================== */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #ebebeb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}>
          {/* Logo & City Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
            {/* Logo Link to Home */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }} onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setActiveSubCategory('All'); }}>
              <div style={{
                background: '#e23744',
                color: 'white',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1.35rem',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 2px 6px rgba(226, 55, 68, 0.3)'
              }}>
                R
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Rent<span style={{ color: '#e23744' }}>AI</span>
              </span>
            </Link>

            {/* Subtle Divider */}
            <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

            {/* Dedicated Location Selector Button */}
            <button
              type="button"
              id="city-picker-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCityModal(true);
              }}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                color: '#1f2937',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#e23744';
                e.currentTarget.style.background = '#fff5f5';
                e.currentTarget.style.color = '#e23744';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#1f2937';
              }}
              title="Click to change your delivery location"
            >
              <MapPin size={14} color="#e23744" />
              <span>{city}</span>
              <ChevronDown size={12} color="#6b7280" />
            </button>
          </div>

          {/* Centered Large Search Bar */}
          <div style={{
            flex: 1,
            maxWidth: '540px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products to rent"
              style={{
                width: '100%',
                padding: '0.65rem 3rem 0.65rem 1.25rem',
                borderRadius: '999px',
                border: '1px solid #dcdcdc',
                background: '#ffffff',
                fontSize: '0.9rem',
                color: '#1f2937',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e23744';
                e.target.style.boxShadow = '0 0 0 3px rgba(226, 55, 68, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dcdcdc';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '34px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            ) : null}
            <Search 
              size={18} 
              color="#9ca3af" 
              style={{ position: 'absolute', right: '14px', pointerEvents: 'none' }} 
            />
          </div>

          {/* Right Navigation & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
              <span style={{ cursor: 'pointer' }}>Limitless</span>
              <span style={{ cursor: 'pointer' }}>RentAI Mover</span>
              <span style={{ cursor: 'pointer' }}>RentAI Stores</span>
            </div>

            {/* Red Pill Login / Profile Button */}
            <Link
              to="/rentals"
              style={{
                textDecoration: 'none',
                background: '#e23744',
                color: '#ffffff',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(226, 55, 68, 0.25)'
              }}
            >
              <span>Login/Signup</span>
              <ChevronRight size={15} />
            </Link>

            {/* Cart Icon with Counter */}
            <Link 
              to="/cart" 
              style={{
                position: 'relative',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.35rem'
              }}
              title="View Cart"
            >
              <ShoppingCart size={22} color="#111827" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  background: '#e23744',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Customer Logout */}
            <button 
              onClick={handleLogout} 
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. SCREENSHOT 1: "EXPLORE OUR TOP CATEGORIES ──" HERO
          ======================================================== */}
      <section style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* Title Header with Red Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#111827' }}>
            Explore <span style={{ color: '#e23744' }}>our Top Categories</span>
          </h1>
          <div style={{ width: '48px', height: '4px', background: '#e23744', borderRadius: '2px', marginLeft: '0.25rem' }} />
        </div>

        {/* 2-Column Hero: Left Promo Banner + Right 4x4 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 330px) 1fr', gap: '2rem', alignItems: 'stretch' }}>
          
          {/* Left: Offset Red Promo Card */}
          <div style={{ position: 'relative', display: 'flex', minHeight: '460px' }}>
            {/* Offset red background card */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '-10px',
              width: '100%',
              height: '94%',
              background: '#e23744',
              borderRadius: '24px',
              zIndex: 1
            }} />
            
            {/* Main Lifestyle Image Card */}
            <div 
              style={{
                position: 'relative',
                zIndex: 2,
                borderRadius: '20px',
                overflow: 'hidden',
                width: '100%',
                backgroundImage: 'url("https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=900")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: '0 16px 36px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '1.75rem'
              }}
            >
              {/* Subtle dark gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)', zIndex: 1 }} />

              {/* Glass overlay badge button */}
              <button
                onClick={() => {
                  setSelectedCategory('Appliances');
                  setActiveSubCategory('Water Purifiers');
                  setSearchQuery('Purifier');
                  const el = document.getElementById('catalog-listing-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  background: 'rgba(18, 18, 18, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '0.9rem 1.35rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e23744'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(18, 18, 18, 0.88)'; }}
              >
                <span>EXPLORE WATER PURIFIERS</span>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          {/* Right: 4x4 Grid of 16 Category Cards (Pure, crisp isolated product icons!) */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}>
              {TOP_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategoryTileClick(cat)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #ebebeb',
                    borderRadius: '16px',
                    padding: '1rem 0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                    minHeight: '104px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#ebebeb';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', marginBottom: '0.4rem' }}>
                    <CategoryIcon type={cat.name} size={44} />
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>

            {/* View More Categories Link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  const el = document.getElementById('catalog-listing-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#e23744',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                View More categories <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RENTAI ASSURANCE & CORE VALUE PILLARS (Signature RentoMojo Benefits) */}
      <AssuranceBanner />

      {/* ========================================================
          3. SCREENSHOT 2: LISTING & FILTER EXPERIENCE
          ======================================================== */}
      <section id="catalog-listing-section" style={{ maxWidth: '1280px', margin: '3.5rem auto 0', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation (Exact replica: Home > Appliances > Washing Machines) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.825rem',
          color: '#6b7280',
          marginBottom: '1.25rem'
        }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={13} />
          <span style={{ color: '#6b7280', cursor: 'pointer' }} onClick={() => setSelectedCategory('Appliances')}>
            {selectedCategory}
          </span>
          {activeSubCategory && (
            <>
              <ChevronRight size={13} />
              <span style={{ color: '#111827', fontWeight: 600 }}>{activeSubCategory}</span>
            </>
          )}
        </div>

        {/* Horizontal Main Category Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          scrollbarWidth: 'none'
        }}>
          {MAIN_CATEGORIES.map((cat, idx) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveSubCategory(cat);
                  setSearchQuery('');
                }}
                style={{
                  padding: '0.55rem 1.4rem',
                  borderRadius: '999px',
                  border: isActive ? 'none' : '1px solid #e0e0e0',
                  background: isActive ? '#e23744' : '#ffffff',
                  color: isActive ? '#ffffff' : '#4b5563',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 8px rgba(226, 55, 68, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sub-Category Visual Strip (Icon Carousel with Active Red Border) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
          scrollbarWidth: 'none'
        }}>
          {SUB_CATEGORY_ICONS.map((sub, idx) => {
            const isActive = activeSubCategory.toLowerCase() === sub.name.toLowerCase() || searchQuery.toLowerCase().includes(sub.query.toLowerCase());
            return (
              <div
                key={idx}
                onClick={() => handleSubCategoryClick(sub)}
                style={{
                  minWidth: '105px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '14px',
                  border: isActive ? '2px solid #e23744' : '1px solid #ebebeb',
                  background: isActive ? '#fff5f5' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <div style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.35rem' }}>
                  <CategoryIcon type={sub.name} size={34} />
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#e23744' : '#4b5563',
                  textAlign: 'center',
                  lineHeight: 1.15
                }}>
                  {sub.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* 2-Column Catalog: Left Filters Sidebar + Right 3-Col Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* ==================== LEFT FILTER SIDEBAR ==================== */}
          <aside style={{
            background: '#ffffff',
            border: '1px solid #ebebeb',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'sticky',
            top: '80px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111827' }}>Filters</h3>
              {(budgetFilter !== 'all' || searchQuery) && (
                <button 
                  onClick={() => { setBudgetFilter('all'); setSearchQuery(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#e23744', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Filter Section: Product Status */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', marginBottom: '0.85rem' }}>
                Product Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox"
                      checked={statusFilter.inStock}
                      onChange={(e) => setStatusFilter(prev => ({ ...prev, inStock: e.target.checked }))}
                      style={{ accentColor: '#e23744', width: '16px', height: '16px' }}
                    />
                    <span>In Stock</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#4b5563', padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                    {inStockCount}
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox"
                      checked={statusFilter.outOfStock}
                      onChange={(e) => setStatusFilter(prev => ({ ...prev, outOfStock: e.target.checked }))}
                      style={{ accentColor: '#e23744', width: '16px', height: '16px' }}
                    />
                    <span>Out of Stock</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#4b5563', padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                    {outOfStockCount}
                  </span>
                </label>
              </div>
            </div>

            {/* Filter Section: Monthly Budget */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', marginBottom: '0.85rem' }}>
                Monthly Budget
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: "All Budgets", val: "all", count: appliances.length },
                  { label: "₹0 - ₹500", val: "0-500", count: count0_500 },
                  { label: "₹501 - ₹1000", val: "501-1000", count: count501_1000 },
                  { label: "₹1001 - ₹5000", val: "1001-5000", count: count1001_5000 },
                  { label: "₹5001+", val: "5001+", count: count5001_plus }
                ].map((b, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="radio" 
                        name="budget"
                        checked={budgetFilter === b.val}
                        onChange={() => setBudgetFilter(b.val)}
                        style={{ accentColor: '#e23744', width: '16px', height: '16px' }}
                      />
                      <span>{b.label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#4b5563', padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                      {b.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </aside>

          {/* ==================== RIGHT PRODUCT GRID ==================== */}
          <main>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                  {activeSubCategory || selectedCategory} on Rent in {city}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Showing {filteredAppliances.length} products with doorstep delivery and free servicing.
                </p>
              </div>
            </div>

            {/* 3-Column Product Cards Grid (Screenshot 2 exact style) */}
            {filteredAppliances.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.75rem'
              }}>
                {filteredAppliances.map((item, idx) => {
                  const isWishlisted = wishlist[item.appliance_id];
                  const isAdded = addedItems[item.appliance_id];
                  const tag = item.tag || (idx % 2 === 0 ? 'Best Seller' : 'Popular');

                  return (
                    <div 
                      key={item.appliance_id || idx}
                      className="product-card"
                      onClick={() => setSelectedProduct(item)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #ebebeb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}
                    >
                      {/* Image Container with Badges */}
                      <div style={{
                        position: 'relative',
                        height: '220px',
                        background: '#f9f9f9',
                        overflow: 'hidden'
                      }}>
                        {/* Best Seller / Popular Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          zIndex: 2,
                          background: tag === 'Best Seller' ? '#00a651' : '#f59e0b',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}>
                          {tag}
                        </div>

                        {/* Heart / Wishlist Button */}
                        <button
                          onClick={(e) => toggleWishlist(item.appliance_id, e)}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 2,
                            background: '#ffffff',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '50%',
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                          }}
                        >
                          <Heart 
                            size={16} 
                            color={isWishlisted ? '#e23744' : '#6b7280'} 
                            fill={isWishlisted ? '#e23744' : 'none'} 
                          />
                        </button>

                        {/* Product Image - Full Cover for Warm Lifestyle Look */}
                        <img 
                          src={item.image_url} 
                          alt={item.rental_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.35s ease'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        />

                        {/* Delivery Banner Strip (Screenshot 2 exact banner) */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(255, 255, 255, 0.96)',
                          backdropFilter: 'blur(4px)',
                          borderTop: '1px solid #f0f0f0',
                          padding: '0.4rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontWeight: 500
                        }}>
                          <Truck size={14} color="#6b7280" />
                          <span>Delivery in 3-5 days</span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div style={{ padding: '1rem 1.15rem 1.15rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{
                          fontSize: '0.925rem',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '1rem',
                          height: '42px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4
                        }} title={item.rental_name}>
                          {item.rental_name}
                        </div>

                        {/* Price & Action Row */}
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly rent</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                              ₹{item.monthly_price}/mo
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(item);
                            }}
                            style={{
                              background: isAdded ? '#16a34a' : '#e23744',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              boxShadow: '0 2px 6px rgba(226, 55, 68, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isAdded ? <Check size={14} /> : 'Rent'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '1px solid #ebebeb',
                borderRadius: '16px',
                padding: '4rem 2rem',
                textAlign: 'center'
              }}>
                <Package size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>No products match your criteria</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                  Try resetting your filters or search keywords to browse our full inventory in {city}.
                </p>
                <button
                  onClick={() => { setSelectedCategory('All'); setActiveSubCategory('All'); setSearchQuery(''); setBudgetFilter('all'); }}
                  style={{
                    background: '#e23744',
                    color: 'white',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* ========================================================
          4. RENT VS BUY SAVINGS CALCULATOR (Signature RentoMojo Tool)
          ======================================================== */}
      <section style={{ maxWidth: '1280px', margin: '4.5rem auto 0', padding: '0 1.5rem' }}>
        <RentVsBuyCalculator />
      </section>

      {/* ========================================================
          5. AI RECOMMENDATIONS (ML ENGINE PRESERVED)
          ======================================================== */}
      {recommendations.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '4rem auto 0', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={20} color="#e23744" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              Personalized Recommendations
            </h2>
            <span style={{ fontSize: '0.75rem', background: '#fef2f2', color: '#e23744', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              AI Powered
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.5rem'
          }}>
            {recommendations.slice(0, 4).map((rec, idx) => {
              const app = rec.recommended_appliance_details;
              if (!app) return null;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedProduct(app)}
                  className="product-card"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #ebebeb',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ height: '190px', background: '#f9f9f9', overflow: 'hidden', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#0284c7', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', zIndex: 2 }}>
                      {(rec.similarity_score * 100).toFixed(0)}% Match
                    </span>
                    <img 
                      src={app.image_url} 
                      alt={app.rental_name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.rental_name}
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827' }}>
                        ₹{app.monthly_price}/mo
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(app); }}
                        style={{
                          background: '#e23744',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.4rem 0.9rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Rent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          5. FLOATING "NEED HELP?" WIDGET (Screenshot 1 & 2 exact)
          ======================================================== */}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 999 }}>
        <button
          onClick={() => setHelpOpen(!helpOpen)}
          style={{
            background: '#e23744',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            padding: '0.75rem 1.4rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(226, 55, 68, 0.4)',
            transition: 'transform 0.2s ease, background 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Headphones size={18} />
          <span>Need Help?</span>
        </button>

        {/* Help Popover */}
        {helpOpen && (
          <div style={{
            position: 'absolute',
            bottom: '60px',
            left: '0',
            width: '280px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #ebebeb',
            boxShadow: '0 16px 36px rgba(0,0,0,0.15)',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>RentAI Support</div>
              <button onClick={() => setHelpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a 
                href="https://wa.me/" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <MessageSquare size={16} />
                <span>Chat on WhatsApp</span>
              </a>
              <a 
                href="tel:18001234567"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <Phone size={16} />
                <span>Call 1800-RentAI</span>
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default HomePage;
