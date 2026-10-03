import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, RefreshCw, Truck, ArrowRight, Layers, Star } from 'lucide-react';

const UNLMTD_TIERS = [
  {
    id: 'studio',
    name: '1 BHK / Studio',
    itemsCount: 3,
    monthlyPrice: 1899,
    originalPrice: 2699,
    savingsPercent: '30%',
    badge: 'Starter Choice',
    tagline: 'Ideal for 1 person or compact studio apartments',
    defaultCategories: ['Living Room', 'Bedroom', 'Appliances']
  },
  {
    id: 'comfort',
    name: '2 BHK Comfort',
    itemsCount: 5,
    monthlyPrice: 3199,
    originalPrice: 4799,
    savingsPercent: '35%',
    badge: 'MOST POPULAR',
    popular: true,
    tagline: 'Complete whole-home package with living + bedroom + appliances',
    defaultCategories: ['Living Room', 'Bedroom', 'Dining Room', 'Appliances']
  },
  {
    id: 'luxury',
    name: '3 BHK Grand Haven',
    itemsCount: 9,
    monthlyPrice: 5499,
    originalPrice: 8999,
    savingsPercent: '40%',
    badge: 'Premium Living',
    tagline: 'Lavish furnishing for large homes, including full electronics & decor',
    defaultCategories: ['Living Room', 'Bedroom', 'Dining Room', 'Appliances', 'Electronics']
  }
];

export default function UNLMTDSubscriptionModal({ isOpen, onClose, appliances = [], onAddBundleToCart }) {
  const [selectedTier, setSelectedTier] = useState(UNLMTD_TIERS[1]); // 2 BHK Comfort default
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const maxItems = selectedTier.itemsCount;
  const isComplete = selectedItems.length === maxItems;

  const handleSelectItem = (appliance) => {
    const isAlready = selectedItems.find(i => i.appliance_id === appliance.appliance_id);
    if (isAlready) {
      setSelectedItems(selectedItems.filter(i => i.appliance_id !== appliance.appliance_id));
    } else {
      if (selectedItems.length >= maxItems) {
        alert(`You've already selected ${maxItems} items for the ${selectedTier.name} plan. Remove an item or upgrade to a higher tier!`);
        return;
      }
      setSelectedItems([...selectedItems, appliance]);
    }
  };

  const handleTierChange = (tier) => {
    setSelectedTier(tier);
    if (selectedItems.length > tier.itemsCount) {
      setSelectedItems(selectedItems.slice(0, tier.itemsCount));
    }
  };

  const filteredCatalog = appliances.filter(app => {
    if (selectedCategoryTab === 'All') return true;
    if (selectedCategoryTab === 'Living Room') return app.category_id?.toLowerCase() === 'living room';
    if (selectedCategoryTab === 'Bedroom') return app.category_id?.toLowerCase() === 'bedroom';
    if (selectedCategoryTab === 'Appliances') return app.category_id?.toLowerCase() === 'appliances';
    if (selectedCategoryTab === 'Dining & WFH') return ['dining room', 'office'].includes(app.category_id?.toLowerCase());
    return true;
  });

  const handleConfirm = async () => {
    if (selectedItems.length < maxItems) {
      alert(`Please select ${maxItems - selectedItems.length} more item(s) to complete your ${selectedTier.name} bundle.`);
      return;
    }

    setIsSubmitting(true);
    // Bundle item representation
    const bundleProduct = {
      appliance_id: `UNLMTD_${selectedTier.id}_${Date.now()}`,
      rental_name: `UNLMTD by Rentora - ${selectedTier.name} (${maxItems} Items Suite)`,
      category_id: "UNLMTD Subscription",
      monthly_price: selectedTier.monthlyPrice,
      security_deposit: 0, // UNLMTD has zero deposit
      image_url: selectedItems[0]?.image_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600",
      description: `Includes: ${selectedItems.map(i => i.rental_name).join(', ')} • 1 Free Annual Style Swap • Free Relocation • ₹10,000 Damage Waiver Included.`,
      tenure: "12",
      is_unlmtd: true,
      bundle_items: selectedItems
    };

    if (onAddBundleToCart) {
      await onAddBundleToCart(bundleProduct);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '1080px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
        >
          <X size={18} color="#4b5563" />
        </button>

        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          color: '#ffffff',
          padding: '2rem 2.5rem',
          borderRadius: '24px 24px 0 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Accent Glow */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-30px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(226,55,68,0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(226, 55, 68, 0.2)', border: '1px solid rgba(226, 55, 68, 0.4)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            <span>RENTORA SIGNATURE WHOLE-HOME SUBSCRIPTION</span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
            UNLMTD <span style={{ color: '#e23744' }}>by Rentora</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
            Furnish your entire home for one flat monthly price. Pick any combination of furniture & appliances with <strong>₹0 security deposit</strong>, <strong>1 free annual style swap</strong>, and <strong>free intercity relocation</strong>.
          </p>

          {/* 4 Feature Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e5e7eb' }}>
              <Shield size={16} color="#4ade80" />
              <span>₹0 Security Deposit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e5e7eb' }}>
              <RefreshCw size={16} color="#60a5fa" />
              <span>1 Free Annual Style Swap</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e5e7eb' }}>
              <Truck size={16} color="#facc15" />
              <span>Free Delivery & Relocation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#e5e7eb' }}>
              <Check size={16} color="#f43f5e" />
              <span>₹10,000 Damage Waiver</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Step 1: Select Plan Tier */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
                1. Choose your UNLMTD Plan Tier
              </div>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Cancel or swap anytime</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {UNLMTD_TIERS.map(tier => {
                const isSelected = selectedTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => handleTierChange(tier)}
                    style={{
                      border: isSelected ? '2px solid #e23744' : '1px solid #e5e7eb',
                      background: isSelected ? '#fff5f5' : '#ffffff',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isSelected ? '0 8px 24px rgba(226,55,68,0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tier.popular && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '16px',
                        background: '#e23744',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        letterSpacing: '0.04em'
                      }}>
                        {tier.badge}
                      </span>
                    )}

                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
                      {tier.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem', minHeight: '36px' }}>
                      {tier.tagline}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e23744' }}>
                        ₹{tier.monthlyPrice.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                        ₹{tier.originalPrice}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                        {tier.savingsPercent} OFF
                      </span>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isSelected ? '#e23744' : '#4b5563',
                      background: isSelected ? 'rgba(226,55,68,0.1)' : '#f3f4f6',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px'
                    }}>
                      <Layers size={13} />
                      <span>Pick Any {tier.itemsCount} Items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Basket Status Bar */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                2. Select Your {maxItems} Items ({selectedItems.length}/{maxItems} Chosen)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>
                {isComplete 
                  ? "🎉 Your suite is fully assembled and ready for checkout!" 
                  : `Select ${maxItems - selectedItems.length} more item(s) from the catalog below.`}
              </div>
            </div>

            {/* Visual Mini Slots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Array.from({ length: maxItems }).map((_, index) => {
                const item = selectedItems[index];
                return (
                  <div
                    key={index}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      border: item ? '2px solid #e23744' : '2px dashed #cbd5e1',
                      background: item ? '#ffffff' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                    title={item ? item.rental_name : `Slot ${index + 1}`}
                  >
                    {item ? (
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{index + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Item Picker Catalog */}
          <div>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {['All', 'Living Room', 'Bedroom', 'Appliances', 'Dining & WFH'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryTab(cat)}
                  style={{
                    background: selectedCategoryTab === cat ? '#111827' : '#ffffff',
                    color: selectedCategoryTab === cat ? '#ffffff' : '#4b5563',
                    border: '1px solid',
                    borderColor: selectedCategoryTab === cat ? '#111827' : '#e5e7eb',
                    padding: '0.45rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid for Selection */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '1rem',
              maxHeight: '380px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {filteredCatalog.map(app => {
                const isSelected = selectedItems.some(i => i.appliance_id === app.appliance_id);
                return (
                  <div
                    key={app.appliance_id}
                    onClick={() => handleSelectItem(app)}
                    style={{
                      border: isSelected ? '2px solid #e23744' : '1px solid #e5e7eb',
                      background: isSelected ? '#fff5f5' : '#ffffff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Checkmark Badge */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 2,
                        background: '#e23744',
                        color: 'white',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        <Check size={14} />
                      </div>
                    )}

                    <div style={{ height: '110px', background: '#f8fafc', overflow: 'hidden' }}>
                      <img src={app.image_url} alt={app.rental_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                        {app.category_id}
                      </span>
                      <div style={{
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        color: '#111827',
                        margin: '0.2rem 0 0.5rem',
                        lineHeight: 1.3,
                        height: '32px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {app.rental_name}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Standard: ₹{app.monthly_price}/mo
                        </span>
                        <button
                          type="button"
                          style={{
                            background: isSelected ? '#e23744' : '#f3f4f6',
                            color: isSelected ? '#ffffff' : '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? 'Selected' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Monthly Subscription</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>
                  ₹{selectedTier.monthlyPrice.toLocaleString('en-IN')}/month
                </span>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
                  (Includes {maxItems} Items + Free Swap & Relocation)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || selectedItems.length < maxItems}
                style={{
                  background: selectedItems.length === maxItems ? '#e23744' : '#9ca3af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 2rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: selectedItems.length === maxItems ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: selectedItems.length === maxItems ? '0 4px 14px rgba(226,55,68,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{isSubmitting ? 'Adding Package...' : `Confirm UNLMTD (${selectedItems.length}/${maxItems})`}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
