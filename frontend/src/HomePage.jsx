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
  Package, 
  Zap, 
  ShieldCheck, 
  Award, 
  ArrowRight, 
  CornerDownLeft, 
  Briefcase, 
  Lock, 
  History,
  Clock,
  Flame,
  Trash2,
  Star,
  Plus
} from 'lucide-react';
import { fetchWithAuth } from './utils/api';
import CitySelectionModal from './CitySelectionModal';
import ProductDetailsModal from './ProductDetailsModal';
import { CategoryIcon } from './CategoryIcons';
import { AssuranceBanner } from './AssuranceBanner';
import { RentVsBuyCalculator } from './RentVsBuyCalculator';
import UNLMTDSubscriptionModal from './UNLMTDSubscriptionModal';
import PincodeCheckerModal from './PincodeCheckerModal';
import CuratedRoomCombos from './CuratedRoomCombos';
import ThemeToggle from './ThemeToggle';

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
  const [activeRecFilter, setActiveRecFilter] = useState('for_you'); // 'for_you' | 'room_bundles' | 'trending'
  const [recLoading, setRecLoading] = useState(false);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});
  const [wishlist, setWishlist] = useState({});
  const [cartCount, setCartCount] = useState(0);
  
  // City
  const [city, setCity] = useState(localStorage.getItem('rentora_city') || 'Hyderabad');
  const [showCityModal, setShowCityModal] = useState(!localStorage.getItem('rentora_city'));

  // Filters & State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Appliances");
  const [activeSubCategory, setActiveSubCategory] = useState("Washing Machines");
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState({ inStock: true, outOfStock: false });
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [helpOpen, setHelpOpen] = useState(false);
  const [showUNLMTDModal, setShowUNLMTDModal] = useState(false);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [storeMode, setStoreMode] = useState('rent'); // 'rent' | 'refurbished'
  const [currentUserRole, setCurrentUserRole] = useState(localStorage.getItem('user_role') || 'customer');
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rentora_recent_searches') || '["Washing Machine", "Double Bed"]');
    } catch {
      return ["Washing Machine", "Double Bed"];
    }
  });

  const PLACEHOLDER_TERMS = [
    'Search "Washing Machine"...',
    'Search "Double Bed with Mattress"...',
    'Search "Double Door Refrigerator"...',
    'Search "L-Shaped 5-Seater Sofa"...',
    'Search "Ergonomic Office Chair"...',
    'Search "Split Air Conditioner"...',
    'Search "55-inch 4K Smart TV"...',
    'Search "Microwave Oven"...'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_TERMS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, Cmd+K, /, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === 'k' && (e.ctrlKey || e.metaKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))
      ) {
        e.preventDefault();
        const searchInput = document.getElementById('main-header-search-input');
        if (searchInput) {
          searchInput.focus();
          setSearchFocused(true);
        }
      }
      if (e.key === 'Escape' && searchFocused) {
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchFocused]);

  // Admin Security Passcode Gate State
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminVerifying, setAdminVerifying] = useState(false);

  const navigate = useNavigate();

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showUserMenu && !e.target.closest('#user-profile-menu-container')) {
        setShowUserMenu(false);
      }
      if (searchFocused && !e.target.closest('#header-search-container')) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showUserMenu, searchFocused]);

  const handleExecuteSearch = (term) => {
    const query = typeof term === 'string' ? term : searchQuery;
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();
    setSearchQuery(cleanQuery);
    setSearchFocused(false);
    setSelectedCategory('All');
    setActiveSubCategory('');

    // Save to recent searches (up to 6, deduplicated)
    setRecentSearches(prev => {
      const updated = [cleanQuery, ...prev.filter(s => s.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, 6);
      localStorage.setItem('rentora_recent_searches', JSON.stringify(updated));
      return updated;
    });

    const catalog = document.getElementById('catalog-listing-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('rentora_recent_searches');
  };

  const handleRemoveRecentSearch = (e, itemToRemove) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== itemToRemove);
      localStorage.setItem('rentora_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Airbnb-Style Host / Owner Switcher
  const handleSwitchToOwner = async () => {
    try {
      setShowUserMenu(false);
      if (currentUserRole !== 'owner') {
        await fetchWithAuth('http://localhost:8000/api/auth/switch-role/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'owner' })
        });
        setCurrentUserRole('owner');
        localStorage.setItem('user_role', 'owner');
      }
      navigate('/owner');
    } catch (e) {
      console.error("Failed to switch to owner:", e);
      navigate('/owner');
    }
  };

  // Admin Security Passcode Verification (Enterprise Protected Route)
  const handleVerifyAdminPasscode = async (e) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setAdminError('Please enter the Admin Security Key');
      return;
    }
    setAdminVerifying(true);
    setAdminError('');
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/auth/switch-role/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', admin_code: adminPasscode.trim() })
      });
      if (res.ok) {
        setCurrentUserRole('admin');
        localStorage.setItem('user_role', 'admin');
        setShowAdminPasscodeModal(false);
        setAdminPasscode('');
        navigate('/admin');
      } else {
        const data = await res.json();
        setAdminError(data.error || 'Invalid Admin Authorization Passcode');
      }
    } catch (err) {
      setAdminError('Server verification error. Try again.');
    } finally {
      setAdminVerifying(false);
    }
  };

  const fetchData = async (selectedCity) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const userRes = await fetchWithAuth('http://localhost:8000/api/auth/me/');
      if (userRes.ok) {
        const u = await userRes.json();
        if (u.role) {
          setCurrentUserRole(u.role);
          localStorage.setItem('user_role', u.role);
        }
        if (u.username) {
          setCurrentUsername(u.username);
          localStorage.setItem('username', u.username);
        }
      }
    } catch (e) {}
    
    setLoading(true);
    try {
      // Recommendations (Hybrid Engine)
      const cityQuery = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : '';
      const recRes = await fetchWithAuth(`http://localhost:8000/api/recommendations/?filter=${activeRecFilter}${cityQuery}`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
      
      // Catalog
      const catCityQuery = selectedCity ? `?city=${selectedCity}` : '';
      const appRes = await fetch(`http://localhost:8000/api/appliances/${catCityQuery}`);
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

  const fetchFilteredRecommendations = async (filterKey, targetCity = city) => {
    try {
      setRecLoading(true);
      setActiveRecFilter(filterKey);
      const cityQuery = targetCity ? `&city=${encodeURIComponent(targetCity)}` : '';
      const recRes = await fetchWithAuth(`http://localhost:8000/api/recommendations/?filter=${filterKey}${cityQuery}`);
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
    } catch (err) {
      console.error('Error filtering recommendations:', err);
    } finally {
      setRecLoading(false);
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
    localStorage.setItem('rentora_city', selected);
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

  const addToCart = async (applianceId, tenure = "3", extraData = null) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const payload = { appliance_id: applianceId, tenure: tenure };
      if (extraData) {
        payload.bundle_data = extraData;
      }
      const res = await fetchWithAuth('http://localhost:8000/api/cart/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAddedItems(prev => ({ ...prev, [applianceId]: true }));
        setCartCount(c => c + 1);
        setSelectedProduct(null);
        setTimeout(() => {
          setAddedItems(prev => ({ ...prev, [applianceId]: false }));
        }, 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleRentCombo = async (combo) => {
    const comboApplianceId = `COMBO_${combo.id}`;
    const bundleData = {
      appliance_id: comboApplianceId,
      rental_name: combo.title,
      category_id: "Room Combo",
      sub_category: combo.room,
      monthly_price: combo.monthlyPrice,
      pricing: {
        "3": combo.monthlyPrice,
        "6": combo.monthlyPrice,
        "12": Math.round(combo.monthlyPrice * 0.9)
      },
      security_deposit: Math.round(combo.monthlyPrice * 1.5),
      image_url: combo.image,
      description: `Curated ${combo.room} Suite. Includes: ${combo.itemsIncluded.join(', ')} with free installation & assembly.`
    };
    await addToCart(comboApplianceId, "6", bundleData);
  };

  const handleAddUNLMTDBundle = async (bundleProduct) => {
    await addToCart(bundleProduct.appliance_id, "12", bundleProduct);
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

  // Filter logic with tokenized multi-word matching
  const filteredAppliances = appliances.filter(app => {
    const activeQuery = (searchQuery || "").toLowerCase().trim();

    // 1. Search Query: Match across ALL fields using multi-word tokens
    if (activeQuery) {
      const words = activeQuery.split(/\s+/).filter(Boolean);
      const fullText = `${app.rental_name || ''} ${app.category_id || ''} ${app.sub_category || ''} ${app.brand || ''} ${app.description || ''}`.toLowerCase();
      const match = words.every(word => fullText.includes(word));
      if (!match) return false;
    }

    // 2. Category Filter: Apply only if NOT doing an active freeform search
    if (!activeQuery && selectedCategory !== "All") {
      if (selectedCategory === "Furniture") {
        const furnCats = ["living room", "bedroom", "dining room", "office"];
        if (!furnCats.includes(app.category_id?.toLowerCase())) return false;
      } else if (app.category_id?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
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

  // Autocomplete matching items for the live header dropdown with multi-word tokens
  const searchMatches = searchQuery.trim().length > 0
    ? appliances.filter(app => {
        const words = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const fullText = `${app.rental_name || ''} ${app.category_id || ''} ${app.sub_category || ''} ${app.brand || ''} ${app.description || ''}`.toLowerCase();
        return words.every(word => fullText.includes(word));
      }).slice(0, 6)
    : [];

  const POPULAR_SEARCHES = [
    { label: "Washing Machine", icon: "⚡", rank: 1, hot: true },
    { label: "Double Bed", icon: "🛏️", rank: 2, hot: true },
    { label: "Refrigerator", icon: "❄️", rank: 3, hot: true },
    { label: "L-Shaped Sofa", icon: "🛋️", rank: 4 },
    { label: "Smart TV", icon: "📺", rank: 5 },
    { label: "Air Conditioner", icon: "💨", rank: 6, tag: "Summer" },
    { label: "Water Purifier", icon: "💧", rank: 7 },
    { label: "Study Table", icon: "💻", rank: 8 }
  ];

  const QUICK_CATEGORIES = [
    { name: "Appliances", icon: "🔌", color: "#eff6ff", text: "#1d4ed8" },
    { name: "Living Room", icon: "🛋️", color: "#fef3c7", text: "#b45309" },
    { name: "Bedroom", icon: "🛏️", color: "#f3e8ff", text: "#7e22ce" },
    { name: "Packages", icon: "📦", color: "#f0fdf4", text: "#15803d" }
  ];

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

      {/* Pincode Delivery Estimator Modal (Rentora 72h Guarantee) */}
      <PincodeCheckerModal
        isOpen={showPincodeModal}
        onClose={() => setShowPincodeModal(false)}
        currentCity={city}
      />

      {/* UNLMTD Whole-Home Subscription Builder Modal (Rentora Signature) */}
      <UNLMTDSubscriptionModal
        isOpen={showUNLMTDModal}
        onClose={() => setShowUNLMTDModal(false)}
        appliances={appliances}
        onAddBundleToCart={handleAddUNLMTDBundle}
      />

      {/* Product Details / Tenure Modal */}
      {selectedProduct && (
        <ProductDetailsModal 
          appliance={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart} 
        />
      )}

      {/* Enterprise Admin Authorization Security Modal */}
      {showAdminPasscodeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            animation: 'modalPop 0.18s ease-out',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowAdminPasscodeModal(false);
                setAdminPasscode('');
                setAdminError('');
              }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} color="#64748b" />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Lock size={26} color="#7c3aed" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.4rem' }}>
                Restricted Admin Console
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                Enter your Administrator Security Key to access internal platform metrics, user moderation, and inventory management.
              </p>
            </div>

            <form onSubmit={handleVerifyAdminPasscode}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Admin Authorization Passcode
                </label>
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setAdminError('');
                  }}
                  placeholder="Enter passcode..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${adminError ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {adminError ? (
                  <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: 600 }}>
                    {adminError}
                  </p>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    💡 Demo Passcode: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, color: '#7c3aed' }}>admin123</code>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasscodeModal(false);
                    setAdminPasscode('');
                    setAdminError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminVerifying}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#7c3aed',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  {adminVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Authorize & Enter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          1. TOP NAVIGATION BAR (Clean, Polished RentoMojo Style)
          ======================================================== */}
      <header className="main-header-bar" style={{
        background: 'var(--header-bg, #ffffff)',
        borderBottom: '1px solid var(--border-color, #ebebeb)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        width: '100%',
        maxWidth: '100vw',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0.55rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Left: Logo & Location Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Logo Link to Home */}
            <Link 
              to="/" 
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.65rem',
                position: 'relative',
                zIndex: 1,
                boxSizing: 'border-box'
              }} 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setActiveSubCategory('All'); }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #e23744 0%, #b91c1c 100%)',
                color: 'white',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1.35rem',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 4px 10px rgba(226, 55, 68, 0.3)'
              }}>
                R
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary-color, #111827)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Rent<span style={{ color: 'var(--primary-color, #e23744)' }}>ora</span>
              </span>
            </Link>

            {/* Subtle Divider */}
            <div style={{ width: '1px', height: '24px', background: '#e5e7eb', margin: '0 0.25rem', pointerEvents: 'none' }} />

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
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                color: '#1f2937',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1,
                margin: 0
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
              title="Click to change your delivery city"
            >
              <MapPin size={15} color="#e23744" />
              <span>{city}</span>
              <ChevronDown size={13} color="#6b7280" />
            </button>

            {/* 72-Hour Express Delivery / Pincode Badge */}
            <button
              type="button"
              id="header-express-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowPincodeModal(true);
              }}
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1,
                margin: 0
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.background = '#dcfce7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#bbf7d0';
                e.currentTarget.style.background = '#f0fdf4';
              }}
              title="Check 72-hour express delivery for your pincode"
            >
              <Zap size={14} color="#16a34a" />
              <span>Express (72h)</span>
            </button>
          </div>

          {/* Center: Live Interactive Search Bar with Floating Autocomplete */}
          <div 
            id="header-search-container"
            className="header-search-wrapper"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              width: '100%'
            }}>
              {/* Left Search Icon inside Input */}
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: searchFocused ? '#e23744' : '#94a3b8',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease',
                  zIndex: 2
                }} 
              />
              <input 
                id="main-header-search-input"
                type="text"
                className="header-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteSearch();
                  }
                }}
                placeholder={PLACEHOLDER_TERMS[placeholderIndex]}
              />

              {/* Action Buttons inside right of Search Bar */}
              <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 2 }}>
                {!searchQuery && (
                  <span className="search-kbd-badge" title="Press Ctrl+K or / to search">
                    <span>Ctrl</span>
                    <span>K</span>
                  </span>
                )}

                {searchQuery ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchFocused(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%'
                    }}
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                ) : null}

                {/* Clickable Search Submit Button */}
                <button
                  type="button"
                  onClick={() => handleExecuteSearch()}
                  style={{
                    background: '#e23744',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'transform 0.15s ease, background 0.15s ease',
                    boxShadow: '0 2px 6px rgba(226, 55, 68, 0.3)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  title="Search catalog"
                >
                  <Search size={14} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Instant Floating Search Suggestions / Results Dropdown */}
            {searchFocused && (
              <div 
                className="header-search-dropdown"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* 1. If user typed nothing yet: Show Recent Searches, Trending Keywords & Quick Categories */}
                {!searchQuery.trim() ? (
                  <div>
                    {/* A. Recent Searches Section (like Amazon / Flipkart / Blinkit) */}
                    {recentSearches && recentSearches.length > 0 && (
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          marginBottom: '0.5rem' 
                        }}>
                          <span style={{ 
                            fontSize: '0.73rem', 
                            fontWeight: 800, 
                            color: '#64748b', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.06em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <Clock size={12} color="#64748b" />
                            <span>Recent Searches</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleClearRecentSearches}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#e23744',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Trash2 size={11} /> Clear all
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                          {recentSearches.map((term, i) => (
                            <div
                              key={i}
                              className="search-recent-item"
                              onClick={() => handleExecuteSearch(term)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <History size={13} color="#94a3b8" />
                                <span style={{ fontWeight: 600 }}>{term}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveRecentSearch(e, term)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '0 0 0 6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  lineHeight: 1
                                }}
                                title="Remove from recent searches"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* B. Trending Searches in City */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.65rem' 
                    }}>
                      <span style={{ 
                        fontSize: '0.74rem', 
                        fontWeight: 800, 
                        color: '#64748b', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <Flame size={14} color="#e23744" />
                        <span>Trending Searches in <strong style={{ color: '#0f172a' }}>{city}</strong></span>
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Hot this week</span>
                    </div>

                    {/* Horizontal Pill Tags with Rankings & Icons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.15rem' }}>
                      {POPULAR_SEARCHES.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          className="search-trending-tag"
                          onClick={() => handleExecuteSearch(item.label)}
                        >
                          <span 
                            className="search-rank-badge" 
                            style={{ 
                              background: item.rank === 1 ? '#fee2e2' : '#f1f5f9', 
                              color: item.rank === 1 ? '#e23744' : '#64748b' 
                            }}
                          >
                            {item.rank || i + 1}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                          <span>{item.label}</span>
                          {item.hot && (
                            <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>HOT</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* C. Quick Category Jump Section */}
                    <div style={{ 
                      paddingTop: '0.85rem', 
                      borderTop: '1px solid #f1f5f9' 
                    }}>
                      <div style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 800, 
                        color: '#94a3b8', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        marginBottom: '0.6rem' 
                      }}>
                        Explore Popular Categories
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {QUICK_CATEGORIES.map((cat, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="search-quick-category-btn"
                            onClick={() => {
                              setSelectedCategory(cat.name);
                              setActiveSubCategory('All');
                              setSearchQuery('');
                              setSearchFocused(false);
                              const catalog = document.getElementById('catalog-listing-section');
                              if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <span style={{ 
                              background: cat.color, 
                              color: cat.text, 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '8px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}>
                              {cat.icon}
                            </span>
                            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{cat.name}</div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Browse rentals</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* D. Footer Tips Bar */}
                    <div style={{ 
                      marginTop: '0.9rem', 
                      paddingTop: '0.65rem', 
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      color: '#94a3b8'
                    }}>
                      <span>⚡ Free doorstep delivery & installation across {city}</span>
                      <span>Press <strong>Enter ↵</strong> to search • <strong>Esc</strong> to close</span>
                    </div>
                  </div>
                ) : (
                  /* 2. If user typed a search term: Show matching products */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                        Matching Products for "<strong style={{ color: '#111827' }}>{searchQuery}</strong>"
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {searchMatches.length} suggested
                      </span>
                    </div>

                    {searchMatches.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {searchMatches.map((item) => (
                          <div
                            key={item.appliance_id}
                            onClick={() => {
                              setSelectedProduct(item);
                              setSearchFocused(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.5rem 0.65rem',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img 
                                src={item.image_url} 
                                alt={item.rental_name} 
                                style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                              />
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                  {item.rental_name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px' }}>
                                  <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>{item.category_id}</span>
                                  {item.sub_category && <span>• {item.sub_category}</span>}
                                  <span style={{ color: (item.stock_quantity || 0) > 0 ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                                    • {(item.stock_quantity || 0) > 0 ? '🟢 In Stock' : '⚡ Express 72h'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e23744' }}>
                                ₹{item.monthly_price}/mo
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                View <ArrowRight size={10} />
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* View all matching items in catalog button */}
                        <button
                          type="button"
                          onClick={() => handleExecuteSearch()}
                          style={{
                            marginTop: '0.4rem',
                            background: '#fff5f5',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            padding: '0.6rem',
                            color: '#e23744',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            width: '100%',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                        >
                          <span>Explore all results in catalog section</span>
                          <CornerDownLeft size={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: '#64748b' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                          No exact products found for "{searchQuery}"
                        </div>
                        <div style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                          Try searching for "Bed", "Sofa", "Refrigerator", or "Washing Machine".
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
                            handleExecuteSearch('');
                          }}
                          style={{
                            background: '#e23744',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.45rem 1rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Browse Full Catalog
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Navigation & Action Buttons (Airbnb-Style Clean Architecture) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            {/* UNLMTD Plans Modal Button */}
            <button
              type="button"
              id="unlmtd-plans-btn"
              onClick={() => setShowUNLMTDModal(true)}
              style={{
                background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                color: '#ffffff',
                border: '1px solid #374151',
                borderRadius: '999px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 1,
                margin: 0
              }}
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(226, 55, 68, 0.4)'; e.currentTarget.style.borderColor = '#e23744'; }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = '#374151'; }}
              title="Build Whole-Home Furniture & Appliance Subscription"
            >
              <Sparkles size={13} color="#fca5a5" />
              <span>UNLMTD</span>
              <span style={{ fontSize: '0.62rem', background: '#e23744', padding: '0.08rem 0.35rem', borderRadius: '4px' }}>NEW</span>
            </button>

            {/* My Rentals Dedicated Button */}
            <button 
              type="button"
              id="header-my-rentals-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  navigate('/rentals');
                } catch {
                  window.location.href = '/rentals';
                }
              }}
              className="header-action-btn header-btn-rentals"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', position: 'relative', zIndex: 100 }}
              title="View your active rentals, monthly payments & maintenance"
            >
              <Package size={14} color="#e23744" />
              <span>My Rentals</span>
            </button>

            {/* Airbnb-Style "Switch to Owner" Host Mode Button */}
            <button
              type="button"
              id="header-switch-owner-btn"
              onClick={handleSwitchToOwner}
              className={`header-action-btn header-btn-owner ${currentUserRole === 'owner' ? 'is-owner' : ''}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              title="List your appliances and earn monthly rental payouts"
            >
              <Briefcase size={14} color="#059669" />
              <span>{currentUserRole === 'owner' ? '💼 Owner Portal' : 'Switch to Owner'}</span>
            </button>


            {/* Shopping Cart Button */}
            <button 
              type="button"
              id="header-cart-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/cart');
              }}
              style={{
                position: 'relative',
                color: 'var(--text-primary, #1f2937)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.45rem',
                borderRadius: '8px',
                transition: 'background 0.15s ease',
                boxSizing: 'border-box',
                zIndex: 1,
                margin: 0
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-muted, #f1f5f9)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              title="View Cart"
            >
              <ShoppingCart size={22} color="currentColor" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-4px',
                  background: '#e23744',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(226, 55, 68, 0.4)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle />

            {/* Professional User Profile Avatar Dropdown */}
            <div id="user-profile-menu-container" style={{ position: 'relative', boxSizing: 'border-box' }}>
              <button
                type="button"
                id="user-profile-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '999px',
                  padding: '0.35rem 0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  position: 'relative',
                  zIndex: 1,
                  margin: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                title="Account menu & portal access"
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: currentUserRole === 'admin' ? '#7c3aed' : currentUserRole === 'owner' ? '#059669' : '#e23744',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}>
                  {(currentUsername || 'U').charAt(0)}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  {currentUsername || 'My Account'}
                </span>
                <ChevronDown size={13} color="#64748b" />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: '0 16px 36px -4px rgba(0,0,0,0.16)',
                  width: '230px',
                  zIndex: 1500,
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {/* User Profile Header */}
                  <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>
                      {currentUsername || 'Rentora User'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '3px' }}>
                      <span style={{
                        background: currentUserRole === 'admin' ? '#f5f3ff' : currentUserRole === 'owner' ? '#ecfdf5' : '#f8fafc',
                        color: currentUserRole === 'admin' ? '#7c3aed' : currentUserRole === 'owner' ? '#059669' : '#475569',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        textTransform: 'capitalize'
                      }}>
                        {currentUserRole}
                      </span>
                      <span>• Active Session</span>
                    </div>
                  </div>

                  {/* Customer Rentals */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/rentals');
                    }}
                    style={{
                      padding: '0.5rem 0.65rem',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Package size={15} color="#e23744" />
                    <span>My Rentals & Invoices</span>
                  </button>

                  {/* KYC Verification */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/kyc');
                    }}
                    style={{
                      padding: '0.5rem 0.65rem',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ShieldCheck size={15} color="#10b981" />
                    <span>Identity KYC Verification</span>
                  </button>

                  {/* Owner Portal Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSwitchToOwner();
                    }}
                    style={{
                      padding: '0.5rem 0.65rem',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Briefcase size={15} color="#059669" />
                    <span>Owner / Partner Hub</span>
                  </button>

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '0.25rem 0' }} />

                  {/* Protected Admin Access */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (currentUserRole === 'admin') {
                        navigate('/admin');
                      } else {
                        setShowAdminPasscodeModal(true);
                      }
                    }}
                    style={{
                      padding: '0.5rem 0.65rem',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f5f3ff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lock size={15} color="#7c3aed" />
                      <span>Admin Console</span>
                    </div>
                    {currentUserRole !== 'admin' && (
                      <span style={{ fontSize: '0.65rem', background: '#ede9fe', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>LOCK</span>
                    )}
                  </button>

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '0.25rem 0' }} />

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    style={{
                      padding: '0.5rem 0.65rem',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={15} color="#dc2626" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
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

      {/* ========================================================
          UNLMTD BY RENTORA HERO BANNER (Rentora Signature Feature)
          ======================================================== */}
      <section style={{ maxWidth: '1280px', margin: '2rem auto 0', padding: '0 1.5rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          padding: '2.5rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)'
        }}>
          {/* Subtle Ambient Red Glow */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(226, 55, 68, 0.28) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(226, 55, 68, 0.2)', border: '1px solid rgba(226, 55, 68, 0.4)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, color: '#fca5a5', marginBottom: '1rem' }}>
              <Sparkles size={14} />
              <span>WHOLE-HOME SUBSCRIPTION SUITE</span>
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 0.75rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Furnish Your Whole Home with <span style={{ color: '#e23744' }}>UNLMTD</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Why rent piece-by-piece? Choose 3, 5, or 9 items across living, bedroom, dining & appliances starting at just <strong>₹1,899/month</strong>. Includes <strong>₹0 security deposit</strong>, <strong>1 free annual style swap</strong>, and <strong>free intercity relocation</strong>.
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowUNLMTDModal(true)}
                style={{
                  background: '#e23744',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem 1.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(226, 55, 68, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span>Customize Your Suite</span>
                <ArrowUpRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} color="#4ade80" />
                  <span>0 Deposit</span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap size={16} color="#facc15" />
                  <span>72h Express Setup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Plan Tier Preview Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            padding: '1.5rem',
            minWidth: '260px',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.75rem' }}>
              POPULAR SUBSCRIPTIONS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div onClick={() => setShowUNLMTDModal(true)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>1 BHK (3 Items)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Studio Starter</div>
                </div>
                <div style={{ fontWeight: 900, color: '#f87171', fontSize: '1rem' }}>₹1,899/mo</div>
              </div>
              <div onClick={() => setShowUNLMTDModal(true)} style={{ cursor: 'pointer', background: 'rgba(226,55,68,0.15)', border: '1px solid rgba(226,55,68,0.3)', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>2 BHK (5 Items) 🔥</div>
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Most Popular</div>
                </div>
                <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '1rem' }}>₹3,199/mo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RENTORA ASSURANCE & CORE VALUE PILLARS (Signature Rentora Benefits) */}
      <AssuranceBanner onOpenUNLMTD={() => setShowUNLMTDModal(true)} />

      {/* CURATED ROOM COMBOS (Rentora 1-Click Room Packages) */}
      <CuratedRoomCombos onRentCombo={handleRentCombo} />

      {/* ========================================================
          3. SCREENSHOT 2: LISTING & FILTER EXPERIENCE
          ======================================================== */}
      <section id="catalog-listing-section" style={{ maxWidth: '1280px', margin: '4rem auto 0', padding: '0 1.5rem' }}>
        
        {/* Dual Mode Storefront Switcher: Rent vs Buy Refurbished (Rentora Dual Model) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
              Choose Your Shopping Mode:
            </div>
            <div style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: '0.2rem' }}>
              {storeMode === 'rent' 
                ? '🛋️ Renting: Flexible monthly subscription, free servicing, style swap anytime' 
                : '🏷️ Buy Certified Refurbished: Gently pre-loved items at 65% off with 1-Year Warranty & Assured Buyback'}
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => {
                setStoreMode('rent');
                const el = document.getElementById('catalog-listing-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: storeMode === 'rent' ? '#e23744' : 'transparent',
                color: storeMode === 'rent' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: storeMode === 'rent' ? '0 2px 8px rgba(226,55,68,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🛋️ Rent Monthly</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStoreMode('refurbished');
                const el = document.getElementById('catalog-listing-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: storeMode === 'refurbished' ? '#111827' : 'transparent',
                color: storeMode === 'refurbished' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: storeMode === 'refurbished' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Award size={14} color={storeMode === 'refurbished' ? '#f59e0b' : '#64748b'} />
              <span>🏷️ Buy Pre-Loved Refurbished</span>
              <span style={{ fontSize: '0.65rem', background: '#f59e0b', color: '#111827', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>65% OFF</span>
            </button>
          </div>
        </div>

        {/* Dynamic Mode Confirmation Strip */}
        <div style={{
          background: storeMode === 'rent' ? '#fff1f2' : '#f8fafc',
          border: `1px solid ${storeMode === 'rent' ? '#fecaca' : '#e2e8f0'}`,
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: storeMode === 'rent' ? '#991b1b' : '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <span>{storeMode === 'rent' ? '🛋️' : '🏷️'}</span>
            <span>
              {storeMode === 'rent' 
                ? 'Monthly Subscription Active: Free maintenance, style upgrades, and ₹0 damage waiver included.' 
                : 'Rentora Certified Pre-Loved Store Active: Buy at 65% OFF with 1-Year Warranty & Assured Buyback.'}
            </span>
          </div>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
            padding: '0.2rem 0.6rem', 
            borderRadius: '6px', 
            background: storeMode === 'rent' ? '#e23744' : '#111827', 
            color: '#ffffff' 
          }}>
            {storeMode === 'rent' ? 'Rent Mode' : 'Buy Mode'}
          </span>
        </div>

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
            {/* Active Search Results Banner */}
            {searchQuery ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff5f5',
                border: '1.5px solid #fecaca',
                borderRadius: '14px',
                padding: '0.9rem 1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(226, 55, 68, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    background: '#e23744',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Search size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
                      Showing results for "<span style={{ color: '#e23744' }}>{searchQuery}</span>"
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {filteredAppliances.length} product(s) found across all categories in {city}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setActiveSubCategory('All');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#e23744',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  <X size={14} />
                  <span>Clear Search</span>
                </button>
              </div>
            ) : null}

            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                  {searchQuery ? `Search Results for "${searchQuery}"` : (activeSubCategory || selectedCategory)} on Rent in {city}
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
                            {storeMode === 'rent' ? (
                              <>
                                <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly rent</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                                  ₹{item.monthly_price}/mo
                                </span>
                              </>
                            ) : (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Certified Pre-Loved</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>
                                    ₹{Math.round(item.monthly_price * 5.2).toLocaleString('en-IN')}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                                    ₹{Math.round(item.monthly_price * 5.2 * 2.8).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(item);
                            }}
                            style={{
                              background: isAdded ? '#16a34a' : storeMode === 'rent' ? '#e23744' : '#111827',
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
                              boxShadow: isAdded ? '0 2px 6px rgba(22, 163, 74, 0.3)' : storeMode === 'rent' ? '0 2px 6px rgba(226, 55, 68, 0.25)' : '0 2px 6px rgba(0, 0, 0, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isAdded ? <Check size={14} /> : storeMode === 'rent' ? 'Rent' : 'Buy Now'}
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
          5. AI RECOMMENDATIONS (REAL-TIME HYBRID ENGINE & XAI)
          ======================================================== */}
      {recommendations.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '4.5rem auto 0', padding: '0 1.5rem' }}>
          {/* Header & Multi-Rail Filter Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <div style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '8px' }}>
                  <Sparkles size={20} color="#e23744" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  AI Recommendation Hub
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  background: 'linear-gradient(135deg, #e23744 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Hybrid Engine 2.0
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                Context-aware suggestions based on your cart, room setups, and popular trends in <strong>{city}</strong>.
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.25rem',
              borderRadius: '10px',
              gap: '0.35rem'
            }}>
              {[
                { id: 'for_you', label: '🌟 For You' },
                { id: 'room_bundles', label: '🛋️ Room Combos' },
                { id: 'trending', label: `📍 Popular in ${city}` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => fetchFilteredRecommendations(tab.id)}
                  style={{
                    background: activeRecFilter === tab.id ? '#ffffff' : 'transparent',
                    color: activeRecFilter === tab.id ? '#0f172a' : '#64748b',
                    border: 'none',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeRecFilter === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {recLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#e23744' }} />
              <div style={{ fontSize: '0.85rem' }}>Recalculating real-time hybrid scores...</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
              gap: '1.5rem'
            }}>
              {recommendations.slice(0, 8).map((rec, idx) => {
                const app = rec.recommended_appliance_details;
                if (!app) return null;
                const appId = app.appliance_id || app._id;
                const isAdded = addedItems[appId];

                return (
                  <div
                    key={rec.recommendation_id || idx}
                    onClick={() => setSelectedProduct(app)}
                    className="product-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                  >
                    {/* Image Container with Badges */}
                    <div style={{ height: '195px', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                      {/* Match Score Badge */}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: 'white',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        zIndex: 2,
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                      }}>
                        {rec.match_percentage || (rec.similarity_score * 100).toFixed(0)}% Match ⚡
                      </span>

                      {/* Bundle / Smart Add-on Badge */}
                      {rec.bundle_badge && (
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          zIndex: 2
                        }}>
                          {rec.bundle_badge}
                        </span>
                      )}

                      <img 
                        src={app.image_url} 
                        alt={app.rental_name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }} 
                      />
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {app.category_id || 'Appliances'}
                        </span>
                        {app.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            <span>{app.rating}</span>
                          </div>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 0.6rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {app.rental_name}
                      </h3>

                      {/* Explainable AI (XAI) Reason Pill */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.75rem',
                        color: '#334155',
                        marginBottom: '0.85rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.35rem',
                        lineHeight: 1.35
                      }}>
                        <Sparkles size={13} color="#e23744" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{rec.recommendation_reason}</span>
                      </div>

                      {/* Pricing & 1-Click Action Buttons */}
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Monthly Rent</span>
                          <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>
                            ₹{app.monthly_price}
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(appId, "6", app);
                            }}
                            style={{
                              background: isAdded ? '#059669' : '#e23744',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.45rem 0.75rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isAdded ? (
                              <>
                                <Check size={14} />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus size={14} />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rentora Support</div>
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
                <span>Call 1800-Rentora</span>
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default HomePage;
