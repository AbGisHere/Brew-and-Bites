import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
// REMOVED: import { store } from '../store' 
import { useAuth } from '../context/AuthContext'
import ReceiptModal from './ReceiptModal'
import PaymentModal from './PaymentModal'
import QRCodeDisplay from './QRCodeDisplay'
import WaiterDashboard from './WaiterDashboard'
import EyeIcon from './icons/EyeIcon'
import PenIcon from './icons/PenIcon'
import TrashIcon from './icons/TrashIcon'
import CopyIcon from './icons/CopyIcon'
import UserPlusIcon from './icons/UserPlusIcon'
import QrcodeIcon from './icons/QrcodeIcon'
// Import jsPDF with CommonJS require since the module import is causing issues
const { jsPDF } = window.jspdf || {};
import('jspdf-autotable');
import { FiStar, FiUsers, FiUserPlus, FiKey } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_URL from '../config'; // <--- 1. IMPORT THIS
import { MenuItem, colors, AnimatedButton, Section, animatedButtonStyles, deleteButtonStyles, tableButtonStyles, statusBadgeStyles } from '../styles/shared';

// Inject CSS for view button animations
const injectViewButtonStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('view-button-styles')) {
    const style = document.createElement('style');
    style.id = 'view-button-styles';
    style.textContent = `
      .view-button:hover {
        background: rgba(212, 167, 106, 0.25) !important;
        transform: scale(0.98) !important;
        box-shadow: 0 6px 32px -2px rgba(212, 167, 106, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(212, 167, 106, 0.1) !important;
        border: 1px solid rgba(212, 167, 106, 0.3) !important;
        border-radius: 12px !important;
        color: #3E2723 !important;
      }
      
      .view-button:hover .arr-1 { 
        right: -25% !important; 
      }
      .view-button:hover .arr-2 { 
        left: 16px !important; 
      }
      .view-button:hover .text { 
        transform: translateX(12px) !important; 
      }
      .view-button:hover svg { 
        fill: #3E2723 !important; 
      }
      .view-button:hover .circle { 
        width: 200px !important; 
        height: 200px !important; 
        opacity: 1 !important; 
        background-color: rgba(212, 167, 106, 0.3) !important;
      }
      
      .view-button:active {
        background: linear-gradient(135deg, rgba(212, 167, 106, 0.5) 0%, rgba(212, 167, 106, 0.35) 100%) !important;
        transform: scale(0.96) !important;
        box-shadow: 0 4px 20px rgba(212, 167, 106, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        border: 1px solid rgba(212, 167, 106, 0.5) !important;
        border-radius: 12px !important;
        color: #3E2723 !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .view-button:active .circle { 
        opacity: 1; 
        width: 200%; 
        height: 500%; 
      }
    `;
    document.head.appendChild(style);
  }
};

// Helper to map MongoDB _id to the id your UI expects
const mapId = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(d => ({ ...d, id: d._id || d.id }));
  if (typeof data === 'object') return { ...data, id: data._id || data.id };
  return data;
};

// --- HELPER: Convert backend data to your UI format ---
const processMenuData = (items) => {
  // Handle case where items is not an array (null, undefined, or error response)
  if (!Array.isArray(items)) {
    console.warn('processMenuData: items is not an array, returning empty object');
    return {};
  }
  
  return items.reduce((acc, item) => {
    // Map MongoDB _id to the 'id' your UI expects
    const uiItem = { ...item, id: item._id };
    
    // Add availability field if it doesn't exist (default to true)
    if (uiItem.available === undefined) {
      uiItem.available = true;
    }
    
    // Group by category
    const category = uiItem.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(uiItem);
    return acc;
  }, {});
};

function FeaturedDishesManager() {
  const [menu, setMenu] = useState({})
  const [activeCategory, setActiveCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Fetch Menu Data
  const loadMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu`);
      const data = await res.json();
      const grouped = processMenuData(data);
      setMenu(grouped);
      // Set initial category if needed
      if (!activeCategory && Object.keys(grouped).length > 0) {
        setActiveCategory(Object.keys(grouped)[0]);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadMenu(); }, []);

  // 2. Toggle Featured (API Update)
  const toggleFeatured = async (category, itemId) => {
    try {
      // Find the item to get current status
      const item = menu[category].find(i => i.id === itemId);
      if(!item) return;

      await fetch(`${API_URL}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !item.featured })
      });
      loadMenu(); // Refresh UI
    } catch (err) { console.error(err); }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return menu[activeCategory] || []
    return (menu[activeCategory] || []).filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [menu, activeCategory, searchTerm])

  const featuredCount = useMemo(() => {
    return Object.values(menu).flat().filter(item => item.featured !== false).length
  }, [menu])

  // --- YOUR EXACT UI ---
  return (
    <div className="space-y-6">
      <Section title={
        <div className="flex justify-between items-center">
          <span>Featured Dishes</span>
          <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            {featuredCount} {featuredCount === 1 ? 'item' : 'items'} featured
          </span>
        </div>
      }>
        <p className="text-gray-600 mb-4">
          Select which dishes appear on the homepage. Toggle the star to feature/unfeature items.
        </p>
        
        {/* Search and filter */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dishes..."
              className="input w-full p-3 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Category tabs */}
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {Object.keys(menu).map(category => {
              const isActive = activeCategory === category;
              const buttonColor = isActive ? '#D4A76A' : '#D4A76A';
              const hoverColor = '#3E2723';
              
              return (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category)
                    setSearchTerm('') 
                  }}
                  className={`animated-button group relative inline-flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'active' : ''
                  }`}
                  style={{
                    '--color': buttonColor,
                    '--hover-color': hoverColor,
                    '--box-shadow': `0 0 0 2px ${buttonColor}`,
                    '--active-box-shadow': `0 0 0 4px ${buttonColor}`,
                    padding: '8px 16px',
                    minWidth: '120px',
                    margin: '2px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: isActive ? hoverColor : 'rgba(212, 167, 106, 0.15)',
                    borderRadius: '100px',
                    color: isActive ? 'white' : buttonColor,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    background: isActive 
                      ? hoverColor 
                      : 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)',
                    border: `1px solid rgba(212, 167, 106, 0.3)`,
                    boxShadow: `0 8px 32px rgba(212, 167, 106, 0.15), 0 0 0 2px ${buttonColor}`
                  }}
                >
                  <span className="text" style={{ position: 'relative', zIndex: 1, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}>
                      {(menu[category] || []).filter(i => i.featured !== false).length}
                    </span>
                  </span>
                  <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: buttonColor, borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                  <style>{`
                    .animated-button:hover { 
                      box-shadow: 0 0 0 8px transparent !important; 
                      color: white !important; 
                      border-radius: 12px !important;
                      backdropFilter: 'blur(16px) !important',
                      WebkitBackdropFilter: 'blur(16px) !important',
                      background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.4) 0%, rgba(212, 167, 106, 0.2) 100%) !important',
                      border: '1px solid rgba(212, 167, 106, 0.5) !important',
                      boxShadow: '0 12px 40px rgba(212, 167, 106, 0.25), 0 0 0 8px transparent !important' !important;
                    }
                    .animated-button:active { 
                      transform: scale(0.95) !important; 
                      box-shadow: 0 0 0 4px ${buttonColor} !important; 
                    }
                    .animated-button:hover .circle { 
                      width: 200px !important; 
                      height: 200px !important; 
                      opacity: 1 !important; 
                      background-color: ${hoverColor} !important;
                    }
                    .active { 
                      box-shadow: 0 0 0 4px ${buttonColor} !important; 
                      background-color: ${hoverColor} !important; 
                      color: white !important;
                      backdropFilter: 'blur(12px) !important',
                      WebkitBackdropFilter: 'blur(12px) !important',
                      border: '1px solid rgba(212, 167, 106, 0.4) !important',
                      boxShadow: '0 8px 32px rgba(212, 167, 106, 0.2), 0 0 0 4px ${buttonColor} !important' !important;
                    }
                  `}</style>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dishes list */}
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  item.featured !== false ? 'border-yellow-200 bg-yellow-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{item.name}</div>
                    {item.featured !== false && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{item.description}</div>
                  <div className="text-sm font-semibold text-primary">₹{parseFloat(item.price).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => toggleFeatured(activeCategory, item.id)}
                  className={`animated-button waiter ${item.featured !== false ? 'active' : ''}`}
                  style={{
                    '--ab-color': item.featured !== false ? '#f59e0b' : '#D1D5DB',
                    '--ab-hover': '#1e40af',
                    '--ab-text': item.featured !== false ? '#1e40af' : '#4B5563'
                  }}
                  title={item.featured !== false ? 'Remove from featured' : 'Add to featured'}
                >
                  <FiStar 
                    className={`w-5 h-5 ${item.featured !== false ? 'fill-current' : ''}`} 
                  />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {searchTerm ? 'No matching dishes found. Try a different search term.' : 'No items in this category.'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="animated-button text-sm"
                  style={{
                    '--ab-color': '#3b82f6',
                    '--ab-hover': '#1e40af',
                    padding: '4px 12px',
                    fontSize: '14px',
                    minWidth: '150px',
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    border: '2px solid',
                    borderColor: 'transparent',
                    fontWeight: '600',
                    backgroundColor: 'transparent',
                    borderRadius: '100px',
                    color: '#D4A76A',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    boxShadow: '0 0 0 2px #D4A76A'
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function CouponManager() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({ 
    code: '', 
    type: 'percentage', 
    value: '', 
    maxUses: null,
    minOrderValue: null,
    allowedDays: [],
    allowedHours: { start: '00:00', end: '23:59' },
    validFrom: '',
    validTo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // 1. Fetch Coupons
  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/coupons`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      alert('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCoupons(); }, []);

  // 2. Create Coupon
  const create = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create coupon');
      }
      
      await loadCoupons();
      setForm({ code: '', type: 'percentage', value: 10, maxUses: null, minOrderValue: null, allowedDays: [], allowedHours: { start: '00:00', end: '23:59' }, validFrom: '', validTo: '' });
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error creating coupon');
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Delete Coupon
  const del = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/coupons/${code}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete coupon');
      }
      
      await loadCoupons();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error deleting coupon');
    } finally {
      setIsLoading(false);
    }
  }

  // 4. Edit Coupon Functions
  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxUses: coupon.maxUses,
      minOrderValue: coupon.minOrderValue,
      allowedDays: coupon.allowedDays || [],
      allowedHours: coupon.allowedHours || { start: '00:00', end: '23:59' },
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : ''
    });
    setIsEditMode(true);
  };

  const updateCoupon = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/api/coupons/${editingCoupon.code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: form.type,
          value: parseFloat(form.value),
          maxUses: form.maxUses,
          minOrderValue: form.minOrderValue,
          allowedDays: form.allowedDays,
          allowedHours: form.allowedHours,
          validFrom: form.validFrom ? new Date(form.validFrom) : null,
          validTo: form.validTo ? new Date(form.validTo) : null
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update coupon');
      }
      
      await loadCoupons();
      resetForm();
      alert('Coupon updated successfully');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error updating coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      code: '', 
      type: 'percentage', 
      value: '', 
      maxUses: null,
      minOrderValue: null,
      allowedDays: [],
      allowedHours: { start: '00:00', end: '23:59' },
      validFrom: '',
      validTo: ''
    });
    setEditingCoupon(null);
    setIsEditMode(false);
  };

  return (
    <>
      <Section title={isEditMode ? "Edit Coupon" : "Create New Coupon"}>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <form onSubmit={isEditMode ? updateCoupon : create} className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gradient-to-br from-amber-50/30 to-orange-50/20 rounded-2xl p-6 backdrop-blur-sm border border-amber-200/20">
              <h3 className="text-lg font-semibold mb-4 text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-800">Coupon Code</label>
                  <input
                    className="w-full px-4 py-3 transition-all duration-200"
                    value={form.code}
                    onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                    placeholder="e.g. WELCOME10"
                    required
                    maxLength="20"
                    disabled={isLoading || isEditMode}
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: 'rgba(253, 249, 243, 0.8)',
                      border: '1px solid rgba(212, 167, 106, 0.3)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                      color: '#3E2723',
                      fontSize: '15px',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                      e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                      e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                    }}
                  />
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-800">Discount Type</label>
                    <div className="relative">
                      <input
                        value={form.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        readOnly
                        onClick={() => setShowDiscountDropdown(!showDiscountDropdown)}
                        className="w-full px-4 py-3 cursor-pointer transition-all duration-200"
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                      {showDiscountDropdown && (
                        <div className="absolute z-50 w-full rounded-lg mt-2" style={{ 
                          maxHeight: '200px', 
                          overflowY: 'auto',
                          backdropFilter: 'blur(40px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.95)',
                          borderRadius: '16px',
                          border: '1px solid rgba(212, 167, 106, 0.2)',
                          boxShadow: '0 8px 32px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(212, 167, 106, 0.05)',
                          padding: '8px'
                        }}>
                          <div
                            className="px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg"
                            onMouseDown={() => {
                              setForm(f => ({...f, type: 'percentage'}));
                              setShowDiscountDropdown(false);
                            }}
                            style={{ 
                              color: '#3E2723',
                              fontSize: '15px', 
                              fontWeight: '500',
                              backdropFilter: 'blur(10px) saturate(120%)',
                              WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                              background: 'rgba(255, 255, 255, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(212, 167, 106, 0.2)';
                              e.target.style.backdropFilter = 'blur(15px) saturate(130%)';
                              e.target.style.WebkitBackdropFilter = 'blur(15px) saturate(130%)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                              e.target.style.backdropFilter = 'blur(10px) saturate(120%)';
                              e.target.style.WebkitBackdropFilter = 'blur(10px) saturate(120%)';
                            }}
                          >
                            Percentage
                          </div>
                          <div
                            className="px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg"
                            onMouseDown={() => {
                              setForm(f => ({...f, type: 'fixed'}));
                              setShowDiscountDropdown(false);
                            }}
                            style={{ 
                              color: '#3E2723',
                              fontSize: '15px', 
                              fontWeight: '500',
                              backdropFilter: 'blur(10px) saturate(120%)',
                              WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                              background: 'rgba(255, 255, 255, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(212, 167, 106, 0.2)';
                              e.target.style.backdropFilter = 'blur(15px) saturate(130%)';
                              e.target.style.WebkitBackdropFilter = 'blur(15px) saturate(130%)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                              e.target.style.backdropFilter = 'blur(10px) saturate(120%)';
                              e.target.style.WebkitBackdropFilter = 'blur(10px) saturate(120%)';
                            }}
                          >
                            Fixed Amount
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2 text-amber-800">
                      {form.type === 'percentage' 
                        ? 'Discount %' 
                        : 'Amount (₹)'}
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step={form.type === 'percentage' ? "1" : "0.01"}
                        min="0"
                        max={form.type === 'percentage' ? "100" : ""}
                        className="w-full px-4 py-3 transition-all duration-200"
                        value={form.value}
                        onChange={e => setForm(f => ({...f, value: parseFloat(e.target.value) || 0}))}
                        required
                        disabled={isLoading}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
                
                {/* Restrictions Section */}
            <div className="bg-gradient-to-br from-amber-50/30 to-orange-50/20 rounded-2xl p-6 backdrop-blur-sm border border-amber-200/20">
              <h3 className="text-lg font-semibold mb-4 text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Usage Restrictions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-800">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 transition-all duration-200"
                    value={form.maxUses || ''}
                    onChange={e => setForm(f => ({...f, maxUses: e.target.value ? parseInt(e.target.value) : null}))}
                    placeholder="No limit"
                    disabled={isLoading}
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: 'rgba(253, 249, 243, 0.8)',
                      border: '1px solid rgba(212, 167, 106, 0.3)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                      color: '#3E2723',
                      fontSize: '15px',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                      e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                      e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-800">
                    Minimum Order Value (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 transition-all duration-200"
                    value={form.minOrderValue || ''}
                    onChange={e => setForm(f => ({...f, minOrderValue: e.target.value ? parseFloat(e.target.value) : null}))}
                    placeholder="No minimum"
                    disabled={isLoading}
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: 'rgba(253, 249, 243, 0.8)',
                      border: '1px solid rgba(212, 167, 106, 0.3)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                      color: '#3E2723',
                      fontSize: '15px',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                      e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                      e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                    }}
                  />
                </div>
              </div>
            </div>

                {/* Schedule Section */}
            <div className="bg-gradient-to-br from-amber-50/30 to-orange-50/20 rounded-2xl p-6 backdrop-blur-sm border border-amber-200/20">
              <h3 className="text-lg font-semibold mb-4 text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Schedule (Optional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 text-amber-800">
                    Allowed Days
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer bg-white/50 px-3 py-2 rounded-lg border border-amber-200/30 hover:bg-white/70 transition-all">
                        <input
                          type="checkbox"
                          checked={form.allowedDays.includes(index)}
                          onChange={e => {
                            const newDays = e.target.checked 
                              ? [...form.allowedDays, index]
                              : form.allowedDays.filter(d => d !== index);
                            setForm(f => ({...f, allowedDays: newDays}));
                          }}
                          disabled={isLoading}
                          className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          style={{
                            backdropFilter: 'blur(20px) saturate(150%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                            background: 'rgba(253, 249, 243, 0.8)',
                            border: '1px solid rgba(212, 167, 106, 0.3)',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                            color: '#3E2723',
                            outline: 'none'
                          }}
                        />
                        <span className="text-sm font-medium text-amber-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-amber-800">
                    Allowed Hours
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="block text-xs mb-2 text-amber-600">Start Time</label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 transition-all duration-200"
                        value={form.allowedHours.start}
                        onChange={e => setForm(f => ({...f, allowedHours: {...f.allowedHours, start: e.target.value}}))}
                        disabled={isLoading}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs mb-2 text-amber-600">End Time</label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 transition-all duration-200"
                        value={form.allowedHours.end}
                        onChange={e => setForm(f => ({...f, allowedHours: {...f.allowedHours, end: e.target.value}}))}
                        disabled={isLoading}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-800">
                      Valid From (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 transition-all duration-200"
                      value={form.validFrom}
                      onChange={e => setForm(f => ({...f, validFrom: e.target.value}))}
                      disabled={isLoading}
                      style={{
                        backdropFilter: 'blur(20px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                        background: 'rgba(253, 249, 243, 0.8)',
                        border: '1px solid rgba(212, 167, 106, 0.3)',
                        borderRadius: '16px',
                        boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                        color: '#3E2723',
                        fontSize: '15px',
                        fontWeight: '500',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                        e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                        e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                        e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                        e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-800">
                      Valid To (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 transition-all duration-200"
                      value={form.validTo}
                      onChange={e => setForm(f => ({...f, validTo: e.target.value}))}
                      disabled={isLoading}
                      style={{
                        backdropFilter: 'blur(20px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                        background: 'rgba(253, 249, 243, 0.8)',
                        border: '1px solid rgba(212, 167, 106, 0.3)',
                        borderRadius: '16px',
                        boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                        color: '#3E2723',
                        fontSize: '15px',
                        fontWeight: '500',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                        e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                        e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                        e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                        e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                      }}
                    />
                  </div>
                </div>
            </div>

            {/* Submit Section */}
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-50/30 to-orange-50/20 rounded-2xl p-6 backdrop-blur-sm border border-amber-200/20">
              {isEditMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isLoading}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                  style={{
                    ...tableButtonStyles.base,
                    ...tableButtonStyles.hover
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="view-button"
                style={{
                  ...animatedButtonStyles.viewButton,
                  background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.4) 0%, rgba(212, 167, 106, 0.3) 100%)',
                  border: '1px solid rgba(212, 167, 106, 0.5)',
                  color: '#3E2723',
                  padding: '16px 32px',
                  fontSize: '16px',
                  minHeight: '56px',
                  minWidth: '180px',
                  opacity: isLoading ? 0.7 : 1,
                  pointerEvents: isLoading ? 'none' : 'auto',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}
              >
                <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#3E2723', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Coupon' : 'Create Coupon')}
                </span>
                <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', backgroundColor: '#3E2723', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '18px', fill: '#3E2723', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
              </button>
            </div>
            </div>
            </div>
          </form>
          </div>
        </Section>

      <Section title="Existing Coupons">
          {isLoading && coupons.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Uses
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Min Order
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid Days
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid Hours
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid From
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid To
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used
                      </th>
                      <th scope="col" className="relative px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-6 py-4 text-center text-sm text-gray-500">
                          No coupons found. Create your first coupon.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <tr key={coupon.code} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <span 
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200"
                                  style={{
                                    ...statusBadgeStyles.default,
                                    borderRadius: '9999px', // Make it pill-shaped like Table Code
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    letterSpacing: '0.05em'
                                  }}
                                >
                                  {coupon.code}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                            {coupon.type === 'percentage' 
                              ? `${coupon.value}% off` 
                              : `₹${parseFloat(coupon.value).toFixed(2)} off`}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.maxUses || '∞'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'None'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.allowedDays && coupon.allowedDays.length > 0 
                              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                                  .filter((_, index) => coupon.allowedDays.includes(index))
                                  .join(', ')
                              : 'All days'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.allowedHours 
                              ? `${coupon.allowedHours.start} - ${coupon.allowedHours.end}`
                              : 'All day'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.validFrom 
                              ? new Date(coupon.validFrom).toLocaleDateString()
                              : 'No limit'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.validTo 
                              ? new Date(coupon.validTo).toLocaleDateString()
                              : 'No limit'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span 
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200"
                              style={{
                                ...statusBadgeStyles.available,
                                fontSize: '11px',
                                fontWeight: '600',
                                letterSpacing: '0.025em',
                                textTransform: 'uppercase'
                              }}
                            >
                              Active
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <div 
                                onClick={() => handleEditCoupon(coupon)}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer edit-btn"
                                style={{
                                  backdropFilter: 'blur(20px) saturate(150%)',
                                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                  background: 'rgba(59, 130, 246, 0.25)', // More visible for glassmorphism
                                  borderRadius: '50%',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  color: '#2563eb',
                                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  outline: 'none' // Remove default focus outline
                                }}
                                onFocus={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.25)';
                                  e.target.style.border = '2px solid rgba(59, 130, 246, 0.6)';
                                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                                  e.target.style.boxShadow = 'none';
                                }}
                                title="Edit"
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.35)';
                                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)';
                                  e.target.style.color = '#1d4ed8';
                                  e.target.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.25)'; // Match new base color
                                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; // Match new base color
                                  e.target.style.color = '#2563eb';
                                  e.target.style.transform = 'scale(1)';
                                }}
                              >
                                <PenIcon 
                                  size={16}
                                  color="#1e40af"
                                  strokeWidth={2}
                                />
                              </div>
                              <div 
                                onClick={() => del(coupon.code)}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer delete-btn"
                                style={{
                                  ...deleteButtonStyles.base,
                                  outline: 'none' // Remove default focus outline
                                }}
                                onFocus={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                                  e.target.style.border = '2px solid rgba(239, 68, 68, 0.6)';
                                  e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                                }}
                                title="Delete"
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.5)';
                                  e.target.style.color = '#b91c1c';
                                  e.target.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                                  e.target.style.color = '#dc2626';
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                                }}
                              >
                                <TrashIcon 
                                  size={16}
                                  color="#dc2626"
                                  strokeWidth={2}
                                  dangerHover={true}
                                  shakeOnClick={true}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </Section>
    </>
  )
}

function SettingsPanel({ onBack }) {
  const [settings, setSettings] = useState({ 
    autoSubmitToChef: true,
    showOrderTime: true,
    showOrderDate: true,
    showOrderID: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [settingsTab, setSettingsTab] = useState('general')
  const { user } = useAuth()
  const isSuperAdmin = user && user.username.toLowerCase() === 'abg'

  // 1. Fetch Settings
  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(setSettings)
      .catch(err => console.error(err));
  }, []);

  // In AdminDashboard.jsx, update the handleSave function:
const handleSave = async () => {
  try {
    setIsSaving(true)
    setSaveStatus('Saving...')
    
    const token = localStorage.getItem('cafe_auth_user');
    if (!token) {
      throw new Error('Not authenticated');
    }
    const user = JSON.parse(token);
    
    // Check if payload might be too large due to logo
    let settingsToSave = { ...settings };
    const payloadSize = JSON.stringify(settingsToSave).length;
    
    // If payload is larger than 1MB, temporarily exclude logo and save it separately
    if (payloadSize > 1024 * 1024 && settingsToSave.restaurantLogo) {
      const logoToSave = settingsToSave.restaurantLogo;
      delete settingsToSave.restaurantLogo;
      
      // Save settings without logo first
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify(settingsToSave)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings = await response.json();
      
      // Then save logo separately
      setTimeout(async () => {
        try {
          const logoResponse = await fetch(`${API_URL}/api/settings`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.id}`
            },
            body: JSON.stringify({ restaurantLogo: logoToSave })
          });

          if (logoResponse.ok) {
            const logoUpdatedSettings = await logoResponse.json();
            setSettings({ ...updatedSettings, restaurantLogo: logoUpdatedSettings.restaurantLogo });
            setSaveStatus('Settings saved successfully!');
          } else {
            setSaveStatus('Settings saved, but logo failed to update');
          }
        } catch (logoError) {
          setSaveStatus('Settings saved, but logo failed to update');
        }
      }, 1000);
      
      setSettings(updatedSettings);
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    // Normal save for smaller payloads
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}`
      },
      body: JSON.stringify(settingsToSave)
    });

    if (!response.ok) {
      throw new Error('Failed to save settings');
    }

    const updatedSettings = await response.json();
    setSettings(updatedSettings);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  } catch (error) {
    setSaveStatus(error.message || 'Failed to save settings');
    setTimeout(() => setSaveStatus(''), 5000);
  } finally {
    setIsSaving(false)
  }
}

  const handleToggleAutoSubmit = (e) => {
    const newSettings = { ...settings, autoSubmitToChef: e.target.checked }
    setSettings(newSettings)
  }

  const handleToggleSiteStatus = (e) => {
    const newSettings = { ...settings, siteClosed: e.target.checked }
    setSettings(newSettings)
  }

  const handleToggleTax = (e) => {
    const newSettings = { 
      ...settings, 
      taxEnabled: e.target.checked,
      // Reset tax rate to 0 if disabling tax
      taxRate: e.target.checked ? (settings.taxRate || 0) : 0
    }
    setSettings(newSettings)
  }

  const handleToggleOrderTime = (e) => {
    const newSettings = { ...settings, showOrderTime: e.target.checked }
    setSettings(newSettings)
  }

  const handleToggleOrderDate = (e) => {
    const newSettings = { ...settings, showOrderDate: e.target.checked }
    setSettings(newSettings)
  }

  const handleToggleOrderID = (e) => {
    const newSettings = { ...settings, showOrderID: e.target.checked }
    setSettings(newSettings)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas to compress the image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate new dimensions (max 300px width, maintain aspect ratio)
        const maxWidth = 300
        const maxHeight = 150
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress the image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to compressed Base64 (JPEG at 0.7 quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
        setSettings({ ...settings, restaurantLogo: compressedBase64 })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleTaxRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const newSettings = { 
      ...settings, 
      taxRate: Math.min(100, Math.max(0, value)) // Keep between 0-100
    }
    setSettings(newSettings)
  }

  // --- YOUR EXACT UI ---
  return (
    <div className="space-y-6">
      {/* Settings Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'general', label: 'General' },
          { id: 'invoice', label: 'Invoice' }
        ].map(t => {
          const isActive = settingsTab === t.id;
          const buttonColor = '#D4A76A';
          const hoverColor = '#3E2723';
          
          return (
            <button
              key={t.id}
              onClick={() => setSettingsTab(t.id)}
              className={`animated-button group relative inline-flex items-center justify-center flex-shrink-0 ${
                isActive ? 'active' : ''
              }`}
              style={{
                '--color': buttonColor,
                '--hover-color': hoverColor,
                '--box-shadow': `0 0 0 2px ${buttonColor}`,
                '--active-box-shadow': `0 0 0 4px ${buttonColor}`,
                padding: '12px 24px',
                minWidth: '140px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: isActive ? hoverColor : 'rgba(212, 167, 106, 0.15)',
                borderRadius: '100px',
                color: isActive ? 'white' : buttonColor,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                background: isActive 
                  ? hoverColor 
                  : 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)',
                border: `1px solid rgba(212, 167, 106, 0.3)`,
                boxShadow: `0 8px 32px rgba(212, 167, 106, 0.15), 0 0 0 2px ${buttonColor}`
              }}
            >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '20px', height: '20px', left: '-25%', fill: isActive ? 'white' : buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)', display: 'flex', alignItems: 'center' }}>
                {t.label}
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: buttonColor, borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '20px', height: '20px', right: '16px', fill: isActive ? 'white' : buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <style>{`
                .animated-button:hover .arr-1,
                .animated-button:hover .arr-2 {
                  fill: white !important;
                }
                .animated-button:hover { 
                  box-shadow: 0 0 0 12px transparent !important; 
                  color: white !important; 
                  border-radius: 12px !important;
                  backdropFilter: 'blur(16px) !important',
                  WebkitBackdropFilter: 'blur(16px) !important',
                  background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.4) 0%, rgba(212, 167, 106, 0.2) 100%) !important',
                  border: '1px solid rgba(212, 167, 106, 0.5) !important',
                  boxShadow: '0 12px 40px rgba(212, 167, 106, 0.25), 0 0 0 12px transparent !important' !important;
                }
                .animated-button:hover .arr-1 { 
                  right: -25% !important; 
                }
                .animated-button:hover .arr-2 { 
                  left: 16px !important; 
                }
                .animated-button:hover .text { 
                  transform: translateX(12px) !important; 
                }
                .animated-button:active { 
                  transform: scale(0.95) !important; 
                  box-shadow: 0 0 0 4px ${buttonColor} !important; 
                }
                .animated-button:hover .circle { 
                  width: 200px !important; 
                  height: 200px !important; 
                  opacity: 1 !important; 
                  background-color: ${hoverColor} !important; 
                }
                .animated-button:hover svg { 
                  fill: white !important; 
                }
                .active { 
                  box-shadow: 0 0 0 4px ${buttonColor} !important; 
                  background-color: ${hoverColor} !important; 
                  color: white !important; 
                  backdropFilter: 'blur(12px) !important',
                  WebkitBackdropFilter: 'blur(12px) !important',
                  border: '1px solid rgba(212, 167, 106, 0.4) !important',
                  boxShadow: '0 8px 32px rgba(212, 167, 106, 0.2), 0 0 0 4px ${buttonColor} !important' !important;
                }
              `}</style>
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      {settingsTab === 'general' && (
        <Section title="General Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border mb-4">
              <div className="flex-1">
                <h5 className="font-medium text-sm">Order Submission (Waiter)</h5>
                <p className="text-xs text-gray-600">
                  {settings.autoSubmitToChef 
                    ? 'Orders taken by Waiters are automatically sent to the kitchen when items are added.'
                    : 'Orders taken by Waiters require manual submission to the kitchen.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.autoSubmitToChef}
                  onChange={handleToggleAutoSubmit}
                />
                <div 
                  className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    background: settings.autoSubmitToChef 
                      ? 'rgba(212, 167, 106, 0.25)' 
                      : 'rgba(139, 90, 43, 0.15)',
                    border: '1px solid',
                    borderColor: settings.autoSubmitToChef 
                      ? 'rgba(212, 167, 106, 0.3)' 
                      : 'rgba(139, 90, 43, 0.25)',
                    boxShadow: settings.autoSubmitToChef
                      ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                      : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                    style={{
                      width: '20px',
                      height: '20px',
                      transform: settings.autoSubmitToChef ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {settings.autoSubmitToChef ? 'Auto-Submit' : 'Manual Submit'}
                </span>
              </label>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center justify-between p-4 rounded-lg border-l-4" style={{
                background: 'linear-gradient(135deg, rgba(253, 249, 243, 0.9) 0%, rgba(253, 249, 243, 0.7) 100%)',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                borderLeftColor: '#D4A76A',
                borderLeftWidth: '4px',
                boxShadow: '0 4px 20px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)'
              }}>
                <div>
                  <h4 className="font-medium" style={{ color: '#3E2723', fontSize: '18px', fontWeight: '600' }}>Website Status</h4>
                  <p className="text-sm" style={{ color: '#8B5A2B', lineHeight: '1.5' }}>
                    {settings.siteClosed 
                      ? 'Website is currently CLOSED. Only super admin can log in.'
                      : 'Website is OPEN for all users to log in.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.siteClosed || false}
                    onChange={handleToggleSiteStatus}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.siteClosed 
                        ? 'rgba(239, 68, 68, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.siteClosed 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.siteClosed
                        ? '0 2px 12px -1px rgba(239, 68, 68, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.siteClosed ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.siteClosed ? 'Site Closed' : 'Site Open'}
                  </span>
                </label>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Invoice Settings */}
      {settingsTab === 'invoice' && (
        <Section title="Invoice Settings">
          <div className="space-y-4">
            {/* Restaurant Information */}
            <div className="p-6 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(253, 249, 243, 0.9) 0%, rgba(253, 249, 243, 0.7) 100%)',
              border: '1px solid rgba(212, 167, 106, 0.2)',
              boxShadow: '0 4px 20px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)'
            }}>
              <h4 className="font-medium mb-4" style={{ color: '#3E2723', fontSize: '18px', fontWeight: '600' }}>Restaurant Information</h4>
              <p className="mb-4" style={{ color: '#8B5A2B', fontSize: '14px', lineHeight: '1.5' }}>
                Configure restaurant details that appear on invoices.
              </p>
              
              {/* Restaurant Logo */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Restaurant Logo</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    Upload your restaurant logo to display on invoices.
                  </p>
                  {settings.restaurantLogo && (
                    <div className="mt-3">
                      <img 
                        src={settings.restaurantLogo} 
                        alt="Restaurant Logo" 
                        className="h-16 w-auto max-w-32 object-contain border rounded"
                      />
                    </div>
                  )}
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showRestaurantLogo || false}
                    onChange={(e) => setSettings({...settings, showRestaurantLogo: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantLogo 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantLogo 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantLogo
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantLogo ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showRestaurantLogo ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>
              
              {/* Restaurant Name */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Restaurant Name</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showRestaurantName 
                      ? 'Restaurant name will be displayed on invoices.'
                      : 'Restaurant name will not be displayed on invoices.'}
                  </p>
                  {settings.showRestaurantName && (
                    <div className="mt-3">
                      <input
                        type="text"
                        className="w-full px-4 py-3 transition-all duration-200"
                        placeholder="Your Restaurant Name"
                        value={settings.restaurantName || ''}
                        onChange={(e) => setSettings({...settings, restaurantName: e.target.value})}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showRestaurantName || false}
                    onChange={(e) => setSettings({...settings, showRestaurantName: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantName 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantName 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantName
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantName ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showRestaurantName ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>

              {/* Restaurant Address */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Restaurant Address</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showRestaurantAddress 
                      ? 'Restaurant address will be displayed on invoices.'
                      : 'Restaurant address will not be displayed on invoices.'}
                  </p>
                  {settings.showRestaurantAddress && (
                    <div className="mt-3">
                      <textarea
                        className="w-full px-4 py-3 transition-all duration-200 resize-none"
                        rows={3}
                        placeholder="Your restaurant address"
                        value={settings.restaurantAddress || ''}
                        onChange={(e) => setSettings({...settings, restaurantAddress: e.target.value})}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showRestaurantAddress || false}
                    onChange={(e) => setSettings({...settings, showRestaurantAddress: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantAddress
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantAddress ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showRestaurantAddress ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>

              {/* Contact Number */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Contact Number</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showContactNumber 
                      ? 'Phone number will be displayed on invoices.'
                      : 'Phone number will not be displayed on invoices.'}
                  </p>
                  {settings.showContactNumber && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={settings.contactNumber}
                        onChange={(e) => setSettings({...settings, contactNumber: e.target.value})}
                        className="w-full px-4 py-3 transition-all duration-200"
                        placeholder="+91 98765 43210"
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showContactNumber || false}
                    onChange={(e) => setSettings({...settings, showContactNumber: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showContactNumber 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showContactNumber 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showContactNumber
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showContactNumber ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showContactNumber ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Email</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showEmail 
                      ? 'Email will be displayed on invoices.'
                      : 'Email will not be displayed on invoices.'}
                  </p>
                  {settings.showEmail && (
                    <div className="mt-3">
                      <input
                        type="email"
                        className="w-full px-4 py-3 transition-all duration-200"
                        placeholder="billing@example.com"
                        value={settings.email || ''}
                        onChange={(e) => setSettings({...settings, email: e.target.value})}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showEmail || false}
                    onChange={(e) => setSettings({...settings, showEmail: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showEmail 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showEmail 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showEmail
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showEmail ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showEmail ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>
            </div>

            {/* Order Information */}
            <div className="p-6 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(253, 249, 243, 0.9) 0%, rgba(253, 249, 243, 0.7) 100%)',
              border: '1px solid rgba(212, 167, 106, 0.2)',
              boxShadow: '0 4px 20px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)'
            }}>
              <h4 className="font-medium mb-4" style={{ color: '#3E2723', fontSize: '18px', fontWeight: '600' }}>Order Information</h4>
              <p className="mb-4" style={{ color: '#8B5A2B', fontSize: '14px', lineHeight: '1.5' }}>
                Configure what order details to display on receipts.
              </p>

              {/* Order Time */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Order Time</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showOrderTime 
                      ? 'Order time will be displayed on receipts.'
                      : 'Order time will not be displayed on receipts.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showOrderTime || false}
                    onChange={(e) => setSettings({...settings, showOrderTime: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showOrderTime 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showOrderTime 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showOrderTime
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showOrderTime ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showOrderTime ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>

              {/* Order Date */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Order Date</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showOrderDate 
                      ? 'Order date will be displayed on receipts.'
                      : 'Order date will not be displayed on receipts.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showOrderDate || false}
                    onChange={(e) => setSettings({...settings, showOrderDate: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showOrderDate 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showOrderDate 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showOrderDate
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showOrderDate ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showOrderDate ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>

              {/* Order ID */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Order ID</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showOrderID 
                      ? 'Sequential Order ID will be displayed on receipts.'
                      : 'Order ID will not be displayed on receipts.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showOrderID || false}
                    onChange={handleToggleOrderID}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showOrderID 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showOrderID 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showOrderID
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showOrderID ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showOrderID ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>
            </div>

            {/* Tax and Regulatory Information */}
            <div className="p-6 rounded-lg" style={{
              background: 'linear-gradient(135deg, rgba(253, 249, 243, 0.9) 0%, rgba(253, 249, 243, 0.7) 100%)',
              border: '1px solid rgba(212, 167, 106, 0.2)',
              boxShadow: '0 4px 20px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)'
            }}>
              <h4 className="font-medium mb-4" style={{ color: '#3E2723', fontSize: '18px', fontWeight: '600' }}>Tax & Regulatory Information</h4>
              <p className="mb-4" style={{ color: '#8B5A2B', fontSize: '14px', lineHeight: '1.5' }}>
                Configure tax and regulatory details for compliance.
              </p>

              {/* Tax Settings */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>Tax Settings</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.taxEnabled 
                      ? `Tax is ENABLED at ${settings.taxRate || 0}%`
                      : 'Tax is currently DISABLED'}
                  </p>
                  {settings.taxEnabled && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.taxRate || 0}
                        onChange={handleTaxRateChange}
                        className="w-24 px-3 py-2 transition-all duration-200"
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '14px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.taxEnabled || false}
                    onChange={handleToggleTax}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantAddress
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantAddress ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.taxEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* GST Number */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>GST Number</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showGSTNumber 
                      ? 'GST number will be displayed on invoices.'
                      : 'GST number will not be displayed on invoices.'}
                  </p>
                  {settings.showGSTNumber && (
                    <div className="mt-3">
                      <input
                        type="text"
                        className="w-full px-4 py-3 transition-all duration-200"
                        placeholder="GSTIN Number (e.g., 07AAAPL1234C1ZV)"
                        value={settings.gstNumber || ''}
                        onChange={(e) => setSettings({...settings, gstNumber: e.target.value.toUpperCase()})}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showGSTNumber || false}
                    onChange={(e) => setSettings({...settings, showGSTNumber: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantAddress
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantAddress ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showGSTNumber ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>

              {/* FSSAI Number */}
              <div className="flex items-center justify-between p-4 rounded-lg border mb-4" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(212, 167, 106, 0.15)',
                boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
              }}>
                <div className="flex-1">
                  <h5 className="font-medium text-sm" style={{ color: '#3E2723', fontWeight: '600' }}>FSSAI Number</h5>
                  <p className="text-xs" style={{ color: '#8B5A2B' }}>
                    {settings.showFSSAINumber 
                      ? 'FSSAI license number will be displayed on invoices.'
                      : 'FSSAI license number will not be displayed on invoices.'}
                  </p>
                  {settings.showFSSAINumber && (
                    <div className="mt-3">
                      <input
                        type="text"
                        className="w-full px-4 py-3 transition-all duration-200"
                        placeholder="FSSAI License Number (e.g., 12345678901234)"
                        value={settings.fssaiNumber || ''}
                        onChange={(e) => setSettings({...settings, fssaiNumber: e.target.value})}
                        style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(253, 249, 243, 0.8)',
                          border: '1px solid rgba(212, 167, 106, 0.3)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                          color: '#3E2723',
                          fontSize: '15px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.9)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                          e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = 'rgba(253, 249, 243, 0.8)';
                          e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                          e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                        }}
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showFSSAINumber || false}
                    onChange={(e) => setSettings({...settings, showFSSAINumber: e.target.checked})}
                  />
                  <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantAddress
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantAddress ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.showFSSAINumber ? 'Show' : 'Hide'}
                  </span>
                </label>
              </div>
            </div>

            
            {/* Additional Options */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(212, 167, 106, 0.15)',
              boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
            }}>
              <div>
                <h4 className="font-medium" style={{ color: '#3E2723', fontWeight: '600' }}>Include QR Code in Invoice</h4>
                <p className="text-sm" style={{ color: '#8B5A2B' }}>
                  {settings.includeQRInInvoice 
                    ? 'QR code will be included in printed invoices for easy payment.'
                    : 'QR code will not be included in printed invoices.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.includeQRInInvoice || false}
                  onChange={(e) => setSettings({...settings, includeQRInInvoice: e.target.checked})}
                />
                <div 
                    className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.25)' 
                        : 'rgba(139, 90, 43, 0.15)',
                      border: '1px solid',
                      borderColor: settings.showRestaurantAddress 
                        ? 'rgba(212, 167, 106, 0.3)' 
                        : 'rgba(139, 90, 43, 0.25)',
                      boxShadow: settings.showRestaurantAddress
                        ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                        : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                      style={{
                        width: '20px',
                        height: '20px',
                        transform: settings.showRestaurantAddress ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                      }}
                    />
                  </div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {settings.includeQRInInvoice ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </Section>
      )}

      {/* Save/Cancel buttons */}
      <div className="pt-4 border-t">
        <div className="flex justify-end gap-3 items-center flex-nowrap">
          {saveStatus && (
            <span className={`text-sm ${saveStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={onBack}
            className="animated-button group relative inline-flex items-center justify-center"
            style={{
              '--color': '#9CA3AF',
              '--hover-color': '#4B5563',
              padding: '8px 20px',
              fontSize: '14px',
              minWidth: '100px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '600',
              backgroundColor: 'rgba(156, 163, 175, 0.15)',
              borderRadius: '100px',
              color: '#9CA3AF',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              opacity: isSaving ? 0.7 : 1,
              pointerEvents: isSaving ? 'none' : 'auto',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.25) 0%, rgba(156, 163, 175, 0.1) 100%)',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              boxShadow: '0 8px 32px rgba(156, 163, 175, 0.15), 0 0 0 2px #9CA3AF'
            }}
            disabled={isSaving}
          >
            <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#9CA3AF', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
            <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              Cancel
            </span>
            <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#9CA3AF', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
            <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#9CA3AF', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
            <style>{`
              .animated-button:hover:not(:disabled) { 
                box-shadow: 0 0 0 8px transparent !important; 
                color: white !important; 
                border-radius: 12px !important;
                backdropFilter: 'blur(16px) !important',
                WebkitBackdropFilter: 'blur(16px) !important',
                background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.4) 0%, rgba(156, 163, 175, 0.2) 100%) !important',
                border: '1px solid rgba(156, 163, 175, 0.5) !important',
                boxShadow: '0 12px 40px rgba(156, 163, 175, 0.25), 0 0 0 8px transparent !important' !important;
              }
              .animated-button:hover:not(:disabled) .arr-1 { right: -25% !important; }
              .animated-button:hover:not(:disabled) .arr-2 { left: 16px !important; }
              .animated-button:hover:not(:disabled) .text { transform: translateX(12px) !important; }
              .animated-button:hover:not(:disabled) svg { fill: white !important; }
              .animated-button:active:not(:disabled) { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #9CA3AF !important; }
              .animated-button:hover:not(:disabled) .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #4B5563 !important; }
            `}</style>
          </button>
          <button
            onClick={handleSave}
            className="animated-button group relative inline-flex items-center justify-center"
            style={{
              '--color': '#D4A76A',
              '--hover-color': '#3E2723',
              padding: '8px 20px',
              fontSize: '14px',
              minWidth: '110px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '600',
              backgroundColor: 'rgba(212, 167, 106, 0.15)',
              borderRadius: '100px',
              color: '#D4A76A',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              opacity: isSaving ? 0.7 : 1,
              pointerEvents: isSaving ? 'none' : 'auto',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)',
              border: '1px solid rgba(212, 167, 106, 0.3)',
              boxShadow: '0 8px 32px rgba(212, 167, 106, 0.15), 0 0 0 2px #D4A76A'
            }}
            disabled={isSaving}
          >
            <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
            <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </span>
            <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
            <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
            <style>{`
              .animated-button:hover:not(:disabled) { 
                box-shadow: 0 0 0 8px transparent !important; 
                color: white !important; 
                border-radius: 12px !important;
                backdropFilter: 'blur(16px) !important',
                WebkitBackdropFilter: 'blur(16px) !important',
                background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.4) 0%, rgba(212, 167, 106, 0.2) 100%) !important',
                border: '1px solid rgba(212, 167, 106, 0.5) !important',
                boxShadow: '0 12px 40px rgba(212, 167, 106, 0.25), 0 0 0 8px transparent !important' !important;
              }
              .animated-button:hover:not(:disabled) .arr-1 { right: -25% !important; }
              .animated-button:hover:not(:disabled) .arr-2 { left: 16px !important; }
              .animated-button:hover:not(:disabled) .text { transform: translateX(12px) !important; }
              .animated-button:hover:not(:disabled) svg { fill: white !important; }
              .animated-button:active:not(:disabled) { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
              .animated-button:hover:not(:disabled) .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
            `}</style>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard({ onExit }) {
  const [orderingTableId, setOrderingTableId] = useState(null);
  const isUpdating = useRef(false);
  const { user, logout } = useAuth()
  const [menu, setMenu] = useState({})
  const [tab, setTab] = useState('menu')
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' })
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  // Inject CSS styles for view button animations
  useEffect(() => {
    injectViewButtonStyles();
  }, []);
  
  // Fetch all users (only for superadmin)
  const fetchUsers = useCallback(async () => {
    if (user?.username?.toLowerCase() !== 'abg') return;
    
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${user._id}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user]);
  
  // Handle adding a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Username and password are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user._id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const createdUser = await response.json();
      setUsers([...users, createdUser]);
      setNewUser({ username: '', password: '', role: 'admin' });
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };
  
  // Load users when component mounts and when user changes
  useEffect(() => {
    if (user?.username?.toLowerCase() === 'abg') {
      fetchUsers();
    }
  }, [user, fetchUsers]);
  const [tables, setTables] = useState([])
  const [receipts, setReceipts] = useState([])
  const [salesTotal, setSalesTotal] = useState(0)
  const [preview, setPreview] = useState(null)
  const [qrModal, setQrModal] = useState({ open: false, table: null })
  const [recentlyGeneratedCodes, setRecentlyGeneratedCodes] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [hoveredReceiptId, setHoveredReceiptId] = useState(null) // Track which receipt is being hovered
  const [hoveredEditId, setHoveredEditId] = useState(null) // Track which edit button is being hovered
  const [settings, setSettings] = useState({ autoSubmitToChef: true })
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [tableMap, setTableMap] = useState({});
  const [paymentModal, setPaymentModal] = useState({ open: false, receipt: null })

  // Payment handler functions
  const handlePaymentComplete = async (paymentData) => {
    try {
      // Update receipt with payment information
      const response = await fetch(`${API_URL}/api/orders/${paymentData.receiptId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: paymentData.paymentMethod,
          paymentId: paymentData.paymentId,
          amount: paymentData.amount,
          personName: paymentData.personName,
          paymentType: paymentData.paymentType,
          splitDetails: paymentData.splitDetails,
          status: 'paid'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      // Refresh data
      loadAllData();
      
      // Show success message
      if (paymentData.personName) {
        toast.success(`Payment completed for ${paymentData.personName}: ₹${paymentData.amount.toFixed(2)}`);
      } else {
        toast.success(`Payment completed: ₹${paymentData.amount.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Payment completion error:', error);
      toast.error('Failed to complete payment. Please try again.');
    }
  };

  const handleTableClick = (table) => {
    // Find active receipt for this table
    const activeReceipt = receipts.find(r => 
      r.tableId === table._id && r.status === 'open'
    );
    
    if (activeReceipt) {
      // Show payment modal for active bill
      setPaymentModal({ open: true, receipt: activeReceipt });
    } else {
      // Show QR code for ordering
      setQrModal({ open: true, table });
    }
  };

  // Get filtered and sorted receipts based on current filters and sort
  const getFilteredReceipts = useCallback(() => {
    return [...receipts]
      .filter(receipt => {
        if (!dateFilter.startDate && !dateFilter.endDate) return true;
        
        const receiptDate = new Date(receipt.createdAt).setHours(0, 0, 0, 0);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate).setHours(0, 0, 0, 0) : -Infinity;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate).setHours(23, 59, 59, 999) : Infinity;
        
        return receiptDate >= startDate && receiptDate <= endDate;
      });
  }, [receipts, dateFilter]);

  // Export to CSV function
  const exportToCSV = (receiptsToExport) => {
    const headers = ['Receipt ID', 'Date', 'Table', 'Total (₹)', 'Items'];
    
    const csvContent = [
      headers.join(','),
      ...receiptsToExport.map(receipt => {
        const tableName = receipt.tableId 
          ? (tableMap[receipt.tableId._id || receipt.tableId] || `Table ${receipt.tableId.tableNumber || 'N/A'}`) 
          : 'Takeaway';
        
        const items = receipt.items?.map(item => 
          `${item.quantity}x ${item.name} (₹${item.price})`
        ).join('; ') || '';
        
        return [
          `"${receipt._id.slice(-6)}"`,
          `"${new Date(receipt.createdAt).toLocaleString()}"`,
          `"${tableName}"`,
          `"${receipt.total?.toFixed(2) || '0.00'}"`,
          `"${items}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF function
  const exportToPDF = (receiptsToExport) => {
    try {
      if (typeof jsPDF === 'undefined' || !window.jspdf) {
        console.error('jsPDF is not properly loaded');
        alert('Error: PDF generation library not loaded. Please refresh the page and try again.');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;
      let currentPage = 1;
      let totalSales = 0;

      // Simple currency formatter for PDF
      const formatCurrency = (amount) => {
        // Convert to number, handle undefined/NaN cases
        const num = parseFloat(amount) || 0;
        // Simple number formatting with 2 decimal places
        return `Rs. ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      };

      // Add summary table (Page 1)
      const addSummaryTable = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Brew & Bites Café - Sales Summary', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        if (dateFilter.startDate || dateFilter.endDate) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const dateRange = [
            dateFilter.startDate ? `From: ${new Date(dateFilter.startDate).toLocaleDateString()}` : '',
            dateFilter.endDate ? `To: ${new Date(dateFilter.endDate).toLocaleDateString()}` : ''
          ].filter(Boolean).join(' ');
          
          doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // Prepare table data
        const tableData = receiptsToExport.map(receipt => {
          const tableName = receipt.tableId 
            ? (tableMap[receipt.tableId._id || receipt.tableId] || `Table ${receipt.tableId.tableNumber || 'N/A'}`) 
            : 'Takeaway';
          
          return [
            receipt._id.slice(-6).toUpperCase(),
            new Date(receipt.createdAt).toLocaleString(),
            tableName,
            receipt.items?.length || 0,
            formatCurrency(receipt.total)
          ];
        });

        // Add summary table
        doc.autoTable({
          head: [['Order ID', 'Date', 'Table', 'Items', 'Total']],
          body: tableData,
          startY: yPos,
          margin: { top: yPos },
          styles: { 
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            lineWidth: 0.1,
            textColor: [0, 0, 0]
          },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 20, cellPadding: 2 },
            1: { cellWidth: 30, cellPadding: 2 },
            2: { cellWidth: 25, cellPadding: 2 },
            3: { cellWidth: 15, cellPadding: 2, halign: 'center' },
            4: { cellWidth: 20, cellPadding: 2, halign: 'right' }
          },
          didDrawPage: function(data) {
            // Add total at the bottom
            const total = receiptsToExport.reduce((sum, r) => sum + (r.total || 0), 0);
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos;
            
            // Save current font settings
            const prevFont = doc.getFont();
            const prevSize = doc.getFontSize();
            
            // Set new font settings
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            
            // Calculate text width for right alignment
            const text = `Total Sales: ${formatCurrency(total)}`;
            const textWidth = doc.getTextWidth(text);
            
            // Draw the text
            doc.text(
              text,
              pageWidth - margin - textWidth,
              finalY + 10
            );
            
            // Restore previous font settings
            doc.setFont(prevFont.fontName, prevFont.fontStyle);
            doc.setFontSize(prevSize);
          }
        });

        yPos = doc.lastAutoTable.finalY + 15;
      };

      // Add detailed receipt function
      const addReceipt = (receipt) => {
        // Check for page break (leave room for at least one receipt)
        if (yPos > 200) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }

        const tableName = receipt.tableId 
          ? (tableMap[receipt.tableId._id || receipt.tableId] || `Table ${receipt.tableId.tableNumber || 'N/A'}`) 
          : (receipt.deliveryType === 'home' ? 'Home Delivery' : 'Takeaway');

        const receiptTotal = receipt.total || 0;
        const tax = receipt.tax || 0;
        const discount = receipt.discount || 0;
        const subtotal = receiptTotal + discount - tax;

        // Receipt header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Order #${receipt._id.slice(-6).toUpperCase()}`, margin, yPos);
        yPos += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(receipt.createdAt).toLocaleString()}`, margin, yPos);
        yPos += 5;
        
        doc.text(`Order Type: ${tableName}`, margin, yPos);
        yPos += 10;

        // Items header
        doc.setFont('helvetica', 'bold');
        doc.text('Items Ordered:', margin, yPos);
        yPos += 7;
        
        // Items list
        doc.setFont('helvetica', 'normal');
        receipt.items?.forEach(item => {
          if (!item || !item.name) return; // Skip invalid items
          
          // Handle different possible quantity property names
          const quantity = item.quantity || item.quantityOrdered || 1;
          const price = item.price || 0;
          const itemTotal = quantity * price;
          const itemText = `${quantity} × ${item.name}`;
          const priceText = formatCurrency(itemTotal);
          
          // Split long item names across multiple lines
          const maxWidth = 100; // Reduced max width to accommodate price
          const splitText = doc.splitTextToSize(itemText, maxWidth);
          
          // Add item name (first line)
          doc.text(splitText[0], margin + 5, yPos);
          
          // Add price aligned to the right on the same line as the first line of item text
          doc.text(priceText, pageWidth - margin - 5, yPos, { align: 'right' });
          
          // Handle multi-line item names
          if (splitText.length > 1) {
            for (let i = 1; i < splitText.length; i++) {
              yPos += 5;
              doc.text(splitText[i], margin + 5, yPos);
            }
          }
          
          // Move down for next item
          yPos += 5;
        });

        // Order summary
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Order Summary:', margin, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Subtotal:`, margin + 5, yPos);
        doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        
        if (tax > 0) {
          doc.text(`Tax (${receipt.taxRate || 5}%):`, margin + 5, yPos);
          doc.text(formatCurrency(tax), pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        }
        
        if (discount > 0) {
          doc.text(`Discount:`, margin + 5, yPos);
          doc.text(`-${formatCurrency(discount)}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Total:`, margin + 5, yPos);
        doc.text(formatCurrency(receiptTotal), pageWidth - margin, yPos, { align: 'right' });
        yPos += 10;
        
        // Add separator
        doc.setDrawColor(200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;
      };

      // Generate PDF
      addSummaryTable();  // First page with summary table
      
      // Add a new page for detailed receipts
      doc.addPage();
      currentPage = 2;
      yPos = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Detailed Receipts', pageWidth / 2, yPos, { align: 'center' });
      yPos = 30;
      
      // Add all receipts
      receiptsToExport.forEach(receipt => addReceipt(receipt));

      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 
                 pageWidth / 2, 287, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 
                 pageWidth - margin, 287, { align: 'right' });
      }

      // Save the PDF
      doc.save(`BrewBites_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  };
  
  // Handle sorting when column headers are clicked
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // New state for Site Status (requires a new endpoint if you want to persist it)
  const [siteClosed, setSiteClosed] = useState(false);

  // 1. DATA LOADING (Replaces store.getState())
  const loadAllData = useCallback(async (isBackground = false) => {
    // Prevent UI glitches if user is interacting
    if(isUpdating.current) return;
    try {
      // 2. USE API_URL
      const [menuRes, tableRes, receiptRes, userRes, settingRes] = await Promise.all([
         fetch(`${API_URL}/api/menu`).catch(err => {
           console.warn('Backend server not running - menu API failed:', err.message);
           return { ok: false, json: async () => [] };
         }),
         fetch(`${API_URL}/api/tables`).catch(err => {
           console.warn('Backend server not running - tables API failed:', err.message);
           return { ok: false, json: async () => [] };
         }),
         fetch(`${API_URL}/api/receipts?status=closed`).catch(err => {
           console.warn('Backend server not running - receipts API failed:', err.message);
           return { ok: false, json: async () => [] };
         }),
         fetch(`${API_URL}/api/users`).catch(err => {
           console.warn('Backend server not running - users API failed:', err.message);
           return { ok: false, json: async () => [] };
         }),
         fetch(`${API_URL}/api/settings`).catch(err => {
           console.warn('Backend server not running - settings API failed:', err.message);
           return { ok: false, json: async () => ({}) };
         })
      ]);

      const menuData = await menuRes.json();
      setMenu(processMenuData(menuData)); // Helper to group categories
      
      // Process tables and create a map of _id to table name
      const tablesData = await tableRes.json();
      setTables(tablesData);
      
      // Create a map of table _id to table name
      const tableMapping = {};
      tablesData.forEach(table => {
        tableMapping[table._id] = table.name || `Table ${table.tableNumber || 'N/A'}`;
      });
      setTableMap(tableMapping);
      
      const rData = await receiptRes.json();
      const receiptsData = mapId(rData) || [];
      setReceipts(receiptsData);
      setSalesTotal(receiptsData.reduce((sum, r) => sum + (r.total || 0), 0));

      setUsers(await userRes.json());
      
      const sData = await settingRes.json();
      setSiteClosed(sData.siteClosed || false);
      setSettings(sData);

    } catch (err) { console.error("Load error:", err); }
  }, []);

  useEffect(() => {
    loadAllData(); // Initial load
    
    // ✅ 3. ADD: Live Polling Interval
    const interval = setInterval(() => {
      loadAllData(true); 
    }, 2000); 
    
    return () => clearInterval(interval);
  }, [loadAllData]);
  
  const categories = useMemo(() => Object.keys(menu), [menu])

  const [form, setForm] = useState({ id: null, category: '', name: '', description: '', price: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // 2. ADD ITEM (API)
  const addItem = async (e) => {
    e.preventDefault()
    const price = parseFloat(form.price)
    if (!form.name || isNaN(price)) return
    
    const payload = { 
      category: form.category,
      name: form.name, 
      description: form.description, 
      price: price,
      available: true // New items are available by default
    }

    try {
       // If Editing, we PUT. If Adding, we POST.
       if (isEditing) {
         await fetch(`${API_URL}/api/menu/${form.id}`, {
           method: 'PUT',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(payload)
         });
       } else {
         const res = await fetch(`${API_URL}/api/menu`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         })
         
         if (!res.ok) throw new Error('Failed to add item')
         
         const newItem = await res.json()
         setMenu(prev => ({
           ...prev,
           [form.category]: [...(prev[form.category] || []), newItem]
         }))
         
         resetForm()
         toast.success('Item added successfully!')
       }
       loadAllData();
    } catch(err) { console.error(err); }
  }
  
  // TOGGLE ITEM AVAILABILITY
  const toggleItemAvailability = async (item) => {
    try {
      const newAvailability = item.available === false ? true : false
      
      console.log('Toggling item:', item)
      console.log('New availability:', newAvailability)
      
      // Get the current item data and update availability
      const updatedItem = {
        category: item.category,
        name: item.name,
        description: item.description || '',
        price: item.price,
        available: newAvailability
      }
      
      console.log('Sending to API:', updatedItem)
      
      const res = await fetch(`${API_URL}/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      })
      
      console.log('API response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API error response:', errorText)
        throw new Error(`Failed to update availability: ${res.status} ${errorText}`)
      }
      
      const responseData = await res.json()
      console.log('API response data:', responseData)
      
      // Update local state
      setMenu(prev => {
        const updatedMenu = { ...prev }
        for (const category in updatedMenu) {
          updatedMenu[category] = updatedMenu[category].map(menuItem => 
            menuItem.id === item.id ? { ...menuItem, available: newAvailability } : menuItem
          )
        }
        return updatedMenu
      })
      
      toast.success(`Item ${newAvailability ? 'available' : 'unavailable'}!`)
    } catch (err) {
      console.error('Toggle availability error:', err)
      toast.error(`Failed to update availability: ${err.message}`)
    }
  }
  
  const editItem = (category, item) => {
    setForm({
      id: item.id, // Using the _id mapped to id
      category,
      name: item.name,
      description: item.description || '',
      price: item.price
    })
    setIsEditing(true)
  }
  
  const resetForm = () => {
    setForm({ id: null, category: form.category, name: '', description: '', price: '' })
    setIsEditing(false)
  }

  // 3. DELETE ITEM (API)
  const deleteItem = async (cat, id) => {
    if(!confirm("Delete item?")) return;
    await fetch(`${API_URL}/api/menu/${id}`, { method: 'DELETE' });
    loadAllData();
  }

  // 4. ADD TABLE (API)
  const addTable = async () => {
    const name = prompt('Table name')
    if (!name) return
    
    try {
      const response = await fetch(`${API_URL}/api/tables`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ name })
      });
      
      if (!response.ok) {
        throw new Error('Backend server not responding');
      }
      
      loadAllData();
      toast.success('Table added successfully!');
    } catch (error) {
      console.error('Failed to add table:', error);
      toast.error('Failed to add table. Please ensure the backend server is running.');
    }
  }

  // 5. DELETE TABLE (API)
  const deleteTable = async (id) => {
      try {
        await fetch(`${API_URL}/api/tables/${id}`, { method: 'DELETE' });
        loadAllData();
      } catch(e) { alert(e.message) }
  }

  // 6. GENERATE TABLE CODES AND QR CODES
  const generateTableCodes = async () => {
    // Confirm before regenerating all codes
    const confirmMessage = "This will generate NEW table codes and QR codes for ALL tables, replacing existing ones. Customers using old codes will need to scan the new QR codes. Continue?";
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tables/generate-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate table codes');
      }
      
      const data = await response.json();
      
      // Track newly generated codes for visual feedback
      const newCodes = new Set(data.tables.map(t => t.tableCode));
      setRecentlyGeneratedCodes(newCodes);
      
      // Clear the highlight after 5 seconds
      setTimeout(() => {
        setRecentlyGeneratedCodes(new Set());
      }, 5000);
      
      // Show detailed success message
      const tableCount = data.tables.length;
      const codesList = data.tables.map(t => `${t.name}: ${t.tableCode}`).join('\n');
      
      alert(`✅ Successfully generated new codes for ${tableCount} table(s)!\n\nNew Table Codes:\n${codesList}\n\nQR codes have been updated automatically.`);
      
      loadAllData(); // Refresh the tables data
    } catch(e) { 
      console.error('Error generating table codes:', e);
      alert(`❌ Error generating table codes: ${e.message || 'Unknown error'}`);
    }
  }

  // 6. ADD USER (API)
  const addWaiter = async () => {
    const username = prompt('Waiter username')
    const password = prompt('Waiter password')
    if (!username || !password) return
    try {
      await fetch(`${API_URL}/api/users`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ username, password, role: 'waiter' })
      });
      alert('Waiter added');
      loadAllData();
    } catch (e) { alert(e.message) }
  }

  const addChef = async () => {
    const username = prompt('Chef username')
    const password = prompt('Chef password')
    if (!username || !password) return
    try {
      await fetch(`${API_URL}/api/users`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ username, password, role: 'chef' })
      });
      alert('Chef added');
      loadAllData();
    } catch (e) { alert(e.message) }
  }

  // 7. DELETE USER (API)
  const deleteUser = async (id) => {
    if (confirm('Delete user?')) { 
        await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
        loadAllData();
    }
  }


  // NEW: FORCE RESET PASSWORD
  const resetUserPassword = async (id, username) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword) return; // User cancelled
    if (newPassword.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user._id || user.id}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      alert(data.message);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error.message);
    }
  }

  // 8. DELETE RECEIPT (API)
  const deleteReceipt = async (receiptId) => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${receiptId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }
      
      // Refresh the receipts list
      loadAllData();
      // Close the modal if it's open
      if (preview) {
        setPreview(null);
      }
      
      // Show success message
      alert('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    }
  }

  // 9. UPDATE RECEIPT (API)
  const updateReceipt = async (receiptId, updatedItems) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${receiptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: updatedItems })
      });

      if (!response.ok) {
        throw new Error('Failed to update receipt');
      }

      // Update the local state to reflect the changes
      const updatedReceipt = mapId(await response.json());
      
      // Update the receipts list
      setReceipts(prevReceipts => 
        prevReceipts.map(r => 
          r.id === updatedReceipt.id ? { ...r, ...updatedReceipt } : r
        )
      );
      
      // Update the preview if it's open
      if (preview && preview.id === updatedReceipt.id) {
        setPreview(updatedReceipt);
      }
      
      // Update sales total
      setSalesTotal(prevTotal => 
        prevTotal - (preview?.total || 0) + updatedReceipt.total
      );
      
      alert('Receipt updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating receipt:', error);
      alert('Failed to update receipt. Please try again.');
      return false;
    }
  }

  // 10. COUPON HANDLING FOR RECEIPTS
  const handleCouponApply = async (couponCode) => {
    if (!preview) return;
    
    try {
      // Calculate current subtotal
      const subtotal = preview.items.reduce((s, it) => s + it.price * it.qty, 0);
      
      // Validate coupon with backend
      const response = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          orderTotal: subtotal
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.valid) {
        alert(result.error || 'Invalid coupon code');
        return;
      }
      
      // Apply coupon to receipt
      const updatedReceipt = {
        ...preview,
        couponCode: result.coupon.code,
        discount: result.coupon.discountAmount,
        total: subtotal - result.coupon.discountAmount + (preview.tax || 0)
      };
      
      // Update receipt in backend
      const updateResponse = await fetch(`${API_URL}/api/orders/${preview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: result.coupon.code,
          discount: result.coupon.discountAmount,
          total: updatedReceipt.total
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to apply coupon');
      }
      
      // Record coupon usage
      await fetch(`${API_URL}/api/coupons/use/${couponCode}`, {
        method: 'POST'
      });
      
      // Update local state
      setPreview(updatedReceipt);
      setReceipts(prevReceipts => 
        prevReceipts.map(r => 
          r.id === updatedReceipt.id ? { ...r, ...updatedReceipt } : r
        )
      );
      
      alert(`Coupon applied! You saved ₹${result.coupon.discountAmount.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Failed to apply coupon. Please try again.');
    }
  };
  
  const handleCouponRemove = async () => {
    if (!preview || !preview.couponCode) return;
    
    try {
      // Calculate new total without discount
      const subtotal = preview.items.reduce((s, it) => s + it.price * it.qty, 0);
      const newTotal = subtotal + (preview.tax || 0);
      
      // Update receipt to remove coupon
      const updatedReceipt = {
        ...preview,
        couponCode: null,
        discount: 0,
        total: newTotal
      };
      
      // Update receipt in backend
      const response = await fetch(`${API_URL}/api/orders/${preview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: null,
          discount: 0,
          total: newTotal
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove coupon');
      }
      
      // Update local state
      setPreview(updatedReceipt);
      setReceipts(prevReceipts => 
        prevReceipts.map(r => 
          r.id === updatedReceipt.id ? { ...r, ...updatedReceipt } : r
        )
      );
      
      alert('Coupon removed successfully');
      
    } catch (error) {
      console.error('Error removing coupon:', error);
      alert('Failed to remove coupon. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Mobile Only - Welcome and Logout */}
      <div className="md:hidden mb-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Welcome,</span>
          <span className="text-sm font-semibold text-primary">{user?.username}</span>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 text-sm"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left mb-6 md:mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Admin Dashboard</h1>
          <p className="text-gray-600 md:mb-0">Manage your restaurant operations efficiently</p>
        </div>
        
        {/* Desktop Only - Welcome and Logout */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Welcome,</span>
            <span className="text-sm font-semibold text-primary">{user?.username}</span>
          </div>
          
          <div className="w-px h-8 bg-gray-300"></div>
          
          <button
            className="animated-button group relative inline-flex items-center justify-center"
            onClick={logout}
            style={{
              '--color': '#8B5A2B',
              '--hover-color': '#5D4037',
              padding: '8px 20px',
              fontSize: '14px',
              minWidth: '120px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '500',
              backgroundColor: 'rgba(139, 90, 43, 0.15)',
              borderRadius: '100px',
              color: '#8B5A2B',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'linear-gradient(135deg, rgba(139, 90, 43, 0.25) 0%, rgba(139, 90, 43, 0.1) 100%)',
              border: '1px solid rgba(139, 90, 43, 0.3)',
              boxShadow: '0 8px 32px rgba(139, 90, 43, 0.15), 0 0 0 2px #8B5A2B'
            }}
          >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#8B5A2B', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16 17l5-5-5-5M19.8 12H4M14 7l-3.2 2.4c-.5.4-.8.9-.8 1.6v5c0 .7.3 1.2.8 1.6L14 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                Logout
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#8B5A2B', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#8B5A2B', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M8 7l5-5 5 5M13 21V4M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <style>{`
                .animated-button:hover { 
                  box-shadow: 0 0 0 8px transparent !important; 
                  color: white !important; 
                  border-radius: 12px !important;
                  backdropFilter: 'blur(16px) !important',
                  WebkitBackdropFilter: 'blur(16px) !important',
                  background: 'linear-gradient(135deg, rgba(139, 90, 43, 0.4) 0%, rgba(139, 90, 43, 0.2) 100%) !important',
                  border: '1px solid rgba(139, 90, 43, 0.5) !important',
                  boxShadow: '0 12px 40px rgba(139, 90, 43, 0.25), 0 0 0 8px transparent !important' !important;
                }
                .animated-button:hover .arr-1 { 
                  right: -25% !important; 
                }
                .animated-button:hover .arr-2 { 
                  left: 16px !important; 
                }
                .animated-button:hover .text { 
                  transform: translateX(12px) !important; 
                }
                .animated-button:active { 
                  transform: scale(0.95) !important; 
                  box-shadow: 0 0 0 4px #8B5A2B !important; 
                }
                .animated-button:hover .circle { 
                  width: 200px !important; 
                  height: 200px !important; 
                  opacity: 1 !important; 
                  background-color: '#5D4037' !important; 
                }
                .animated-button:hover svg { 
                  fill: white !important; 
                }
              `}</style>
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="flex overflow-x-auto pb-3 px-4 md:px-0 md:overflow-visible md:flex-wrap gap-3 mb-6 md:justify-start justify-start scrollbar-hide">
          {[
            { id: 'menu', label: 'Menu' },
            { id: 'receipts', label: 'Receipts' },
            { id: 'tables', label: 'Tables' },
            { id: 'sales', label: 'Sales' },
            { id: 'users', label: 'Users' },
            { id: 'coupons', label: 'Coupons' },
            { id: 'settings', label: 'Settings' },
          ].map(t => {
            const isActive = tab === t.id;
            const buttonColor = isActive ? '#D4A76A' : '#D4A76A';
            const hoverColor = '#3E2723';
            
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`animated-button group relative inline-flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'active' : ''
                }`}
                style={{
                  '--color': buttonColor,
                  '--hover-color': hoverColor,
                  '--box-shadow': `0 0 0 2px ${buttonColor}`,
                  '--active-box-shadow': `0 0 0 4px ${buttonColor}`,
                  padding: '12px 24px',
                  minWidth: '140px',
                  margin: '4px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: isActive ? hoverColor : 'rgba(212, 167, 106, 0.15)',
                  borderRadius: '100px',
                  color: isActive ? 'white' : buttonColor,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  background: isActive 
                    ? hoverColor 
                    : 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)',
                  border: `1px solid rgba(212, 167, 106, 0.3)`,
                  boxShadow: `0 8px 32px rgba(212, 167, 106, 0.15), 0 0 0 2px ${buttonColor}`
                }}
              >
                <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '20px', height: '20px', left: '-25%', fill: isActive ? 'white' : buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)', display: 'flex', alignItems: 'center' }}>
                  {t.label}
                </span>
                <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: buttonColor, borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '20px', height: '20px', right: '16px', fill: isActive ? 'white' : buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <style>{`
                  .animated-button:hover .arr-1,
                  .animated-button:hover .arr-2 {
                    fill: white !important;
                  }
                  .animated-button:hover { 
                    box-shadow: 0 0 0 12px transparent !important; 
                    color: white !important; 
                    border-radius: 12px !important;
                    backdropFilter: 'blur(16px) !important',
                    WebkitBackdropFilter: 'blur(16px) !important',
                    background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.4) 0%, rgba(212, 167, 106, 0.2) 100%) !important',
                    border: '1px solid rgba(212, 167, 106, 0.5) !important',
                    boxShadow: '0 12px 40px rgba(212, 167, 106, 0.25), 0 0 0 12px transparent !important' !important;
                  }
                  .animated-button:hover .arr-1 { 
                    right: -25% !important; 
                  }
                  .animated-button:hover .arr-2 { 
                    left: 16px !important; 
                  }
                  .animated-button:hover .text { 
                    transform: translateX(12px) !important; 
                  }
                  .animated-button:active { 
                    transform: scale(0.95) !important; 
                    box-shadow: 0 0 0 4px #D4A76A !important; 
                  }
                  .animated-button:hover .circle { 
                    width: 220px !important; 
                    height: 220px !important; 
                    opacity: 1 !important; 
                    background-color: ${hoverColor} !important;
                  }
                  .active { 
                    box-shadow: 0 0 0 4px ${buttonColor} !important; 
                    background-color: ${hoverColor} !important; 
                    color: white !important; 
                    backdropFilter: 'blur(12px) !important',
                    WebkitBackdropFilter: 'blur(12px) !important',
                    border: '1px solid rgba(212, 167, 106, 0.4) !important',
                    boxShadow: '0 8px 32px rgba(212, 167, 106, 0.2), 0 0 0 4px ${buttonColor} !important' !important;
                  }
                  .active svg { 
                    fill: white !important; 
                  }
                `}</style>
              </button>
            );
          })}
        </div>
      </div>

      {tab==='menu' && (
        <div className="grid md:grid-cols-3 gap-6 px-4 md:px-0">
          <Section title="Add / Edit Item" className="h-[600px]">
            <div style={{ 
              maxHeight: 'calc(100% - 40px)', // Account for heading height
              padding: '0 8px' // Add padding for button shadows
            }}>
              <form onSubmit={addItem} className="space-y-4">
              <div>
                <label className="block text-sm font-light mb-2" style={{ color: '#6b7280' }}>Category</label>
                <div className="relative">
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    onFocus={(e) => {
                      setShowDropdown(true);
                      e.target.style.background = 'rgba(253, 249, 243, 0.85)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                      e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                    }}
                    onBlur={(e) => {
                      setTimeout(() => setShowDropdown(false), 150);
                      e.target.style.background = 'rgba(253, 249, 243, 0.7)';
                      e.target.style.border = '1px solid rgba(212, 167, 106, 0.2)';
                      e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                    }}
                    className="w-full px-3 py-2 cursor-pointer transition-all duration-200"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: 'rgba(253, 249, 243, 0.7)',
                      border: '1px solid rgba(212, 167, 106, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                      color: '#3E2723',
                      fontSize: '14px',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                    placeholder="Select or type a new category..."
                    required
                  />
                  <style>{`
                    input::placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    input::-webkit-input-placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    input::-moz-placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    input:-ms-input-placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    select::placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    select::-webkit-input-placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    select::-moz-placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                    select:-ms-input-placeholder {
                      color: #8B5A2B !important;
                      opacity: 1 !important;
                    }
                  `}</style>
                  {showDropdown && (
                    <div className="absolute z-50 w-full rounded-md mt-1" style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      backdropFilter: 'blur(40px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                      background: 'rgba(253, 249, 243, 0.85)',
                      borderRadius: '15px',
                      border: '1px solid rgba(212, 167, 106, 0.15)',
                      boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(212, 167, 106, 0.05)',
                      padding: '8px 0'
                    }}>
                      {categories.filter(cat => cat.toLowerCase().includes(form.category.toLowerCase())).map((c, index) => (
                        <div
                          key={c}
                          className="px-4 py-2 cursor-pointer transition-all duration-200"
                          onMouseDown={() => {
                            setForm(f => ({...f, category: c}));
                            setShowDropdown(false);
                          }}
                          style={{ 
                            color: '#3E2723',
                            fontSize: '16px', 
                            fontWeight: '500',
                            borderBottom: index < categories.filter(cat => cat.toLowerCase().includes(form.category.toLowerCase())).length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                            padding: '10px 16px',
                            backdropFilter: 'blur(10px) saturate(120%)',
                            WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                            background: 'rgba(255, 255, 255, 0.05)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(212, 167, 106, 0.15)';
                            e.target.style.backdropFilter = 'blur(15px) saturate(130%)';
                            e.target.style.WebkitBackdropFilter = 'blur(15px) saturate(130%)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.target.style.backdropFilter = 'blur(10px) saturate(120%)';
                            e.target.style.WebkitBackdropFilter = 'blur(10px) saturate(120%)';
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-light mb-2" style={{ color: '#6b7280' }}>Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                  className="w-full px-3 py-2 transition-all duration-200"
                  style={{
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    background: 'rgba(253, 249, 243, 0.7)',
                    border: '1px solid rgba(212, 167, 106, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                    color: '#3E2723',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                  placeholder="Item name"
                  required
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(253, 249, 243, 0.85)';
                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                    e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(253, 249, 243, 0.7)';
                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.2)';
                    e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-light mb-2" style={{ color: '#6b7280' }}>Description</label>
                <input 
                  value={form.description} 
                  onChange={e => setForm(f => ({...f, description: e.target.value}))} 
                  className="w-full px-3 py-2 transition-all duration-200"
                  style={{
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    background: 'rgba(253, 249, 243, 0.7)',
                    border: '1px solid rgba(212, 167, 106, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                    color: '#3E2723',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                  placeholder="Item description (optional)"
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(253, 249, 243, 0.85)';
                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                    e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(253, 249, 243, 0.7)';
                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.2)';
                    e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-light mb-2" style={{ color: '#6b7280' }}>Price</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={form.price} 
                  onChange={e => setForm(f => ({...f, price: e.target.value}))} 
                  className="w-full px-3 py-2 transition-all duration-200"
                  style={{
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    background: 'rgba(253, 249, 243, 0.7)',
                    border: '1px solid rgba(212, 167, 106, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                    color: '#3E2723',
                    fontSize: '14px',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                  placeholder="0.00"
                  required
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(253, 249, 243, 0.85)';
                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                    e.target.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 16px rgba(212, 167, 106, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(253, 249, 243, 0.7)';
                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.2)';
                    e.target.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 12px rgba(212, 167, 106, 0.05)';
                  }}
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="view-button"
                  style={{
                    ...animatedButtonStyles.viewButton,
                    background: 'rgba(212, 167, 106, 0.35)',
                    border: '1px solid rgba(212, 167, 106, 0.5)',
                    color: '#3E2723',
                    padding: '14px 28px',
                    fontSize: '15px',
                    minHeight: '50px',
                    minWidth: '160px'
                  }}
                >
                  <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '14px', height: '14px', left: '-25%', fill: '#3E2723', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                  <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>{isEditing ? 'Update Item' : 'Add Item'}</span>
                  <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#3E2723', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                  <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '14px', height: '14px', right: '16px', fill: '#3E2723', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </button>
              </div>
            </form>
            </div>
          </Section>

          <Section title="Menu Items" className="h-[600px] overflow-hidden">
            <div style={{ 
              maxHeight: 'calc(100% - 40px)', // Account for heading height
              overflow: 'auto',
              padding: '0 30px 0 10px',
              margin: '0 -20px 0 -10px'
            }}>
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-2" style={{ padding: '0 10px' }}>
                      <h4 className="font-semibold capitalize">{cat}</h4>
                      {isEditing && form.category === cat && (
                        <button 
                          className="text-sm text-gray-500 hover:text-gray-700"
                          onClick={resetForm}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                    <div className="space-y-2" style={{ padding: '0 10px' }}>
                      {menu[cat].map(item => (
                        <MenuItem 
                          key={item.id}
                          item={item}
                          showActions={true}
                          onEdit={() => editItem(cat, item)}
                          onDelete={() => deleteItem(cat, item.id)}
                          onToggleAvailability={() => toggleItemAvailability(item)}
                          hoveredEditId={hoveredEditId}
                          setHoveredEditId={setHoveredEditId}
                          className="flex items-start justify-between"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Tips" className="h-[600px] overflow-y-auto">
            <div className="list-disc pl-5 text-sm text-gray-600 space-y-2" style={{ 
              maxHeight: 'calc(100% - 40px)', // Account for heading height
              overflow: 'auto'
            }}>
              <li>Use the glassy dropdown to select from existing categories or type new ones</li>
              <li>All input fields feature beautiful glassy styling with theme colors</li>
              <li>Add Item button has consistent amber styling throughout</li>
              <li>Toggle item availability with the switch next to each menu item</li>
              <li>Disabled items appear dimmed with "Out of Stock" label</li>
              <li>Users cannot see items that are marked as unavailable</li>
              <li>Changes are automatically saved to the secure database!</li>
              <li>Delete items from the menu list on the right side</li>
              <li>Edit existing items by clicking on them in the menu list</li>
              <li>Menu items are grouped by category for better organization</li>
              <li>Featured items appear highlighted in the customer dashboard</li>
              <li>Price updates are reflected immediately across all dashboards</li>
              <li>Category management helps organize your menu efficiently</li>
              <li>Real-time updates ensure data consistency</li>
              <li>Scroll within each section to access all content</li>
              <li>Equal card heights provide a balanced layout</li>
            </div>
          </Section>
        </div>
      )}

      {tab==='receipts' && (
        <div className="px-4 md:px-0">
          <Section title="Receipts">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button 
                    className="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                    style={{
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)',
                      border: '1px solid rgba(212, 167, 106, 0.3)',
                      borderRadius: '12px',
                      color: '#3E2723',
                      boxShadow: '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 167, 106, 0.35) 0%, rgba(212, 167, 106, 0.2) 100%)';
                      e.currentTarget.style.border = '1px solid rgba(212, 167, 106, 0.4)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)';
                      e.currentTarget.style.border = '1px solid rgba(212, 167, 106, 0.3)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    }}
                  >
                    Export
                  </button>
                  <div 
                    className="absolute left-0 mt-1 w-32 rounded-lg shadow-xl py-2 z-50 opacity-0 invisible transition-all duration-300 transform -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
                    style={{ 
                      backdropFilter: 'blur(20px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                      background: 'rgba(253, 249, 243, 0.85)',
                      border: '1px solid rgba(212, 167, 106, 0.3)',
                      boxShadow: '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 16px rgba(212, 167, 106, 0.08)'
                    }}
                  >
                    <button 
                      onClick={() => exportToCSV(getFilteredReceipts())}
                      className="block w-full text-left px-4 py-2 text-sm font-medium transition-all duration-200"
                      style={{
                        background: 'transparent',
                        color: '#3E2723',
                        borderRadius: '8px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(212, 167, 106, 0.15)';
                        e.target.style.borderRadius = '6px';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderRadius = '8px';
                      }}
                    >
                      Export as CSV
                    </button>
                    <button 
                      onClick={() => exportToPDF(getFilteredReceipts())}
                      className="block w-full text-left px-4 py-2 text-sm font-medium transition-all duration-200"
                      style={{
                        background: 'transparent',
                        color: '#3E2723',
                        borderRadius: '8px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(212, 167, 106, 0.15)';
                        e.target.style.borderRadius = '6px';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderRadius = '8px';
                      }}
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
                  <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input"
                    style={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
                  <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input"
                    style={{ padding: '4px 8px', fontSize: '14px' }}
                    min={dateFilter.startDate}
                  />
                </div>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                    className="text-sm text-red-600 hover:underline whitespace-nowrap"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="text-lg font-medium">
                Total Sales: <span className="text-green-600">₹{salesTotal.toFixed(2)}</span>
              </div>
            </div>
            <div 
              className="overflow-x-auto"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '20px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                padding: '20px'
              }}
            >
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b" style={{ borderBottomColor: 'rgba(212, 167, 106, 0.2)' }}>
                    <th 
                      className="text-center p-2 cursor-pointer transition-all duration-200 font-semibold text-amber-900 hover:bg-amber-50/50 rounded-lg px-3"
                      onClick={() => handleSort('_id')}
                    >
                      <div className="flex items-center justify-center">
                        Order #
                        {sortConfig.key === '_id' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-center p-2 cursor-pointer transition-all duration-200 font-semibold text-amber-900 hover:bg-amber-50/50 rounded-lg px-3"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center justify-center">
                        Date
                        {sortConfig.key === 'createdAt' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-center p-2 cursor-pointer transition-all duration-200 font-semibold text-amber-900 hover:bg-amber-50/50 rounded-lg px-3"
                      onClick={() => handleSort('tableId.name')}
                    >
                      <div className="flex items-center justify-center">
                        Table
                        {sortConfig.key === 'tableId.name' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-center p-2 cursor-pointer transition-all duration-200 font-semibold text-amber-900 hover:bg-amber-50/50 rounded-lg px-3"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-center">
                        Total
                        {sortConfig.key === 'total' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="text-center p-2 font-semibold text-amber-900 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // First, create a chronological copy for sequential numbering
                    const chronologicalReceipts = [...getFilteredReceipts()].sort((a, b) => 
                      new Date(a.createdAt) - new Date(b.createdAt)
                    );
                    
                    // Create a map of receipt ID to sequential order number
                    const orderNumberMap = {};
                    chronologicalReceipts.forEach((receipt, index) => {
                      orderNumberMap[receipt.id] = index + 1;
                    });
                    
                    // Now apply user's selected sorting
                    return chronologicalReceipts
                      .sort((a, b) => {
                        let aValue, bValue;
                        
                        // Handle nested properties
                        if (sortConfig.key === 'tableId.name') {
                          aValue = a.tableId?.name || 'Z';
                          bValue = b.tableId?.name || 'Z';
                          
                          // If both are 'Z' (no table), sort by date
                          if (aValue === 'Z' && bValue === 'Z') {
                            return new Date(b.createdAt) - new Date(a.createdAt);
                          }
                          
                          // If one is 'Z', push it to the end
                          if (aValue === 'Z') return sortConfig.direction === 'asc' ? 1 : -1;
                          if (bValue === 'Z') return sortConfig.direction === 'asc' ? -1 : 1;
                        } else {
                          aValue = a[sortConfig.key];
                          bValue = b[sortConfig.key];
                        }
                        
                        // Handle different data types
                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                          return sortConfig.direction === 'asc' 
                            ? aValue.localeCompare(bValue)
                            : bValue.localeCompare(aValue);
                        } else if (aValue instanceof Date && bValue instanceof Date) {
                          return sortConfig.direction === 'asc'
                            ? aValue - bValue
                            : bValue - aValue;
                        } else {
                          return sortConfig.direction === 'asc'
                            ? (aValue || 0) - (bValue || 0)
                            : (bValue || 0) - (aValue || 0);
                        }
                      })
                      .map((r) => (
                        <tr key={r.id} className="border-b hover:bg-amber-50/30 min-w-max transition-all duration-200" style={{ borderBottomColor: 'rgba(212, 167, 106, 0.1)' }}>
                          <td className="p-3 text-center font-medium text-amber-900">
                            <span style={{
                              backdropFilter: 'blur(20px) saturate(150%)',
                              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                              background: 'rgba(212, 167, 106, 0.12)',
                              border: '1px solid rgba(212, 167, 106, 0.35)',
                              color: '#92400e',
                              borderRadius: '50%',
                              boxShadow: '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 0 12px rgba(212, 167, 106, 0.05)',
                              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              fontSize: '12px',
                              fontWeight: '600',
                              letterSpacing: '0.025em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px'
                            }}>
                              #{orderNumberMap[r.id]}
                            </span>
                          </td>
                      <td className="p-3 text-center text-gray-700">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span style={{
                          backdropFilter: 'blur(20px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                          background: 'rgba(254, 243, 199, 0.5)', // Original amber background
                          border: '1px solid rgba(251, 191, 36, 0.3)', // Amber border
                          color: '#92400e', // Amber text
                          borderRadius: '8px',
                          boxShadow: '0 4px 16px rgba(251, 191, 36, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 0 12px rgba(251, 191, 36, 0.05)',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          fontSize: '13px',
                          fontWeight: '600',
                          letterSpacing: '0.025em',
                          padding: '6px 12px',
                          display: 'inline-block'
                        }}>
                          {r.tableId ? (tableMap[r.tableId._id || r.tableId] || `Table ${r.tableId.tableNumber || 'N/A'}`) : 'Takeaway'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-green-700">₹{r.total?.toFixed(2) || '0.00'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div 
                            onClick={() => setPreview(r)}
                            className="w-8 h-8 flex items-center justify-center cursor-pointer"
                            style={{
                              backdropFilter: 'blur(20px) saturate(150%)',
                              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                              background: 'rgba(59, 130, 246, 0.25)', // More visible for glassmorphism
                              borderRadius: '50%',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              color: '#2563eb',
                              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => {
                              e.target.style.background = 'rgba(59, 130, 246, 0.25)';
                              e.target.style.border = '2px solid rgba(59, 130, 246, 0.6)';
                              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                            }}
                            onBlur={(e) => {
                              e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                              e.target.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                              e.target.style.boxShadow = 'none';
                            }}
                            title="View Receipt"
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(59, 130, 246, 0.35)';
                              e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)';
                              e.target.style.color = '#1d4ed8';
                              e.target.style.transform = 'scale(1.02)';
                              setHoveredReceiptId(r.id); // Set hover state for this receipt
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(59, 130, 246, 0.25)'; // Match new base color
                              e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; // Match new base color
                              e.target.style.color = '#2563eb';
                              e.target.style.transform = 'scale(1)';
                              setHoveredReceiptId(null); // Clear hover state
                            }}
                          >
                            <EyeIcon 
                              size={16}
                              color="#1e40af"
                              strokeWidth={2}
                              isHovered={hoveredReceiptId === r.id}
                            />
                          </div>
                          <div 
                            onClick={() => deleteReceipt(r.id)}
                            className="w-8 h-8 flex items-center justify-center cursor-pointer"
                            style={{
                              ...deleteButtonStyles.base,
                              outline: 'none' // Remove default focus outline
                            }}
                            onFocus={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                              e.target.style.border = '2px solid rgba(239, 68, 68, 0.6)';
                              e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
                            }}
                            onBlur={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                              e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                              e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                            }}
                            title="Delete Receipt"
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                              e.target.style.border = '1px solid rgba(239, 68, 68, 0.5)';
                              e.target.style.color = '#b91c1c';
                              e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                              e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                              e.target.style.color = '#dc2626';
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            <TrashIcon 
                              size={16}
                              color="#dc2626"
                              strokeWidth={2}
                              dangerHover={true}
                              shakeOnClick={true}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                    )()}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ✅ ORDERING POPUP MODAL */}
      {orderingTableId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setOrderingTableId(null)} // Click outside to close
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Manage Order
                </h3>
                <p className="text-xs text-gray-500">
                  Editing Table ID: {orderingTableId.slice(-4)}
                </p>
              </div>
              <button 
                onClick={() => setOrderingTableId(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (Waiter Dashboard) */}
            <div className="flex-1 overflow-y-auto bg-gray-50 relative">
              <WaiterDashboard 
                embedded={true} 
                initialTableId={orderingTableId}
                onExit={() => {
                   setOrderingTableId(null); // Close modal when they finish/print
                   loadAllData(); // Refresh Admin view immediately
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {preview && (
        <ReceiptModal
          open={!!preview}
          onClose={() => setPreview(null)}
          receipt={{
            ...preview, 
            ...settings,
            orderNumber: (() => {
              // Calculate the order number using the same logic as the receipts table
              const chronologicalReceipts = [...getFilteredReceipts()].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
              );
              const orderNumberMap = {};
              chronologicalReceipts.forEach((receipt, index) => {
                orderNumberMap[receipt.id] = index + 1;
              });
              return orderNumberMap[preview.id] || preview.id?.slice(-6);
            })()
          }}
          canEdit={true}
          onDelete={deleteReceipt}
          onUpdate={async (items) => {
            const success = await updateReceipt(preview.id, items);
            if (success) {
              // Refresh the data to ensure everything is in sync
              loadAllData();
            }
            return success;
          }}
          onCouponApply={handleCouponApply}
          onCouponRemove={handleCouponRemove}
        />
      )}

      {tab==='coupons' && (
        <div className="grid md:grid-cols-2 gap-6 px-4 md:px-0">
          <CouponManager />
        </div>
      )}

      {tab === 'tables' && (
        <Section title="Tables">
          <div className="mb-6 flex items-center gap-3">
            <button 
              onClick={addTable}
              className="view-button flex-shrink-0"
              style={{
                ...animatedButtonStyles.viewButton,
                minWidth: '120px',
                padding: '12px 20px',
                fontSize: '14px',
                height: '44px'
              }}
            >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '14px', height: '14px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>Add Table</span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '14px', height: '14px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
            </button>
            
            <button 
              onClick={generateTableCodes}
              className="view-button flex-shrink-0"
              style={{
                ...animatedButtonStyles.viewButton,
                minWidth: '200px',
                padding: '12px 24px',
                fontSize: '14px',
                height: '44px'
              }}
            >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '14px', height: '14px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)', color: '#3E2723' }}>Generate QR Codes</span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '14px', height: '14px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
            </button>
          </div>

          {/* Tables List */}
          <div className="overflow-hidden">
            {tables.length === 0 ? (
              <div 
                className="p-12 text-center"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 167, 106, 0.2)',
                  boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                }}
              >
                <div className="text-gray-500 text-lg">No tables found. Add your first table to get started.</div>
              </div>
            ) : (
              <div 
                className="overflow-x-auto"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 167, 106, 0.2)',
                  boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                  padding: '20px'
                }}
              >
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b" style={{ borderBottomColor: 'rgba(212, 167, 106, 0.2)' }}>
                      <th className="text-center p-3 font-semibold text-amber-900 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M5 8v8a2 2 0 002 2h10a2 2 0 002-2V8m-7 4h4" />
                          </svg>
                          Table Name
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold text-amber-900 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Table Code
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold text-amber-900 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          QR Code
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold text-amber-900 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Status
                        </div>
                      </th>
                      <th className="text-center p-3 font-semibold text-amber-900 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map(t => {
                      const hasActiveOrder = t.activeOrderId;
                      return (
                        <tr 
                          key={t.id || t._id} 
                          className="border-b transition-all duration-200 hover:bg-amber-50/30 cursor-pointer"
                          style={{ borderBottomColor: 'rgba(212, 167, 106, 0.1)' }}
                          onClick={() => handleTableClick(t)}
                        >
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <div 
                                className="px-4 py-2 rounded-xl transition-all duration-200"
                                style={{
                                  backdropFilter: 'blur(12px) saturate(120%)',
                                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                  background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.08) 0%, rgba(212, 167, 106, 0.04) 100%)',
                                  border: '1px solid rgba(212, 167, 106, 0.15)',
                                  boxShadow: '0 2px 8px rgba(212, 167, 106, 0.05)'
                                }}
                              >
                                <div className="font-medium text-gray-900 text-sm text-center">{t.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <span 
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                                  recentlyGeneratedCodes.has(t.tableCode) 
                                    ? 'text-amber-800' 
                                    : 'text-amber-700'
                                }`}
                                style={{
                                  ...statusBadgeStyles.default,
                                  borderRadius: '9999px', // Make it pill-shaped
                                  background: recentlyGeneratedCodes.has(t.tableCode)
                                    ? 'rgba(251, 191, 36, 0.25)'
                                    : 'rgba(212, 167, 106, 0.25)',
                                  border: recentlyGeneratedCodes.has(t.tableCode)
                                    ? '1px solid rgba(251, 191, 36, 0.4)'
                                    : '1px solid rgba(212, 167, 106, 0.4)',
                                  color: recentlyGeneratedCodes.has(t.tableCode)
                                    ? '#92400e'
                                    : '#92400e',
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  letterSpacing: '0.05em'
                                }}
                              >
                                {t.tableCode || 'Not generated'}
                              </span>
                              {t.tableCode && (
                                <div 
                                  className="w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200"
                                  style={{
                                    backdropFilter: 'blur(20px) saturate(150%)',
                                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                    background: 'rgba(212, 167, 106, 0.25)', // Glassmorphism background
                                    borderRadius: '50%',
                                    border: '1px solid rgba(212, 167, 106, 0.4)',
                                    color: '#92400e',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                  }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(t.tableCode);
                                    alert('Table code copied to clipboard!');
                                  }}
                                  title="Copy code"
                                  onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(212, 167, 106, 0.35)';
                                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.5)';
                                    e.target.style.color = '#78350f';
                                    e.target.style.transform = 'scale(1.02)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(212, 167, 106, 0.25)'; // Match new base color
                                    e.target.style.border = '1px solid rgba(212, 167, 106, 0.4)'; // Match new base color
                                    e.target.style.color = '#92400e';
                                    e.target.style.transform = 'scale(1)';
                                  }}
                                >
                                  <CopyIcon 
                                    size={16}
                                    color="#92400e"
                                    strokeWidth={2}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              {t.qrCode ? (
                                (() => {
                                  let qrIconRef = null;
                                  return (
                                    <div
                                      className="w-8 h-8 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center justify-center"
                                      style={{
                                        backdropFilter: 'blur(20px) saturate(150%)',
                                        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                        background: 'rgba(212, 167, 106, 0.25)', // Glassmorphism background
                                        borderColor: 'rgba(212, 167, 106, 0.4)',
                                        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)'
                                      }}
                                      onClick={() => setQrModal({ open: true, table: t })}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(212, 167, 106, 0.35)';
                                        e.target.style.borderColor = 'rgba(212, 167, 106, 0.5)';
                                        e.target.style.transform = 'scale(1.02)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(212, 167, 106, 0.2)';
                                        // Start icon animation
                                        if (qrIconRef && qrIconRef.startAnimation) {
                                          qrIconRef.startAnimation();
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = 'rgba(212, 167, 106, 0.25)'; // Match new base color
                                        e.target.style.borderColor = 'rgba(212, 167, 106, 0.4)'; // Match new base color
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                                        // Stop icon animation
                                        if (qrIconRef && qrIconRef.stopAnimation) {
                                          qrIconRef.stopAnimation();
                                        }
                                      }}
                                      title="Click to view QR Code"
                                    >
                                      <QrcodeIcon 
                                        ref={(el) => { qrIconRef = el; }}
                                        size={20}
                                        color="#D4A76A"
                                        strokeWidth={2}
                                      />
                                    </div>
                                  );
                                })()
                              ) : (
                                <div 
                                  className="px-4 py-2 text-sm text-gray-500 rounded-lg"
                                  style={{
                                    background: 'rgba(156, 163, 175, 0.1)',
                                    border: '1px solid rgba(156, 163, 175, 0.2)',
                                    backdropFilter: 'blur(8px) saturate(120%)',
                                    WebkitBackdropFilter: 'blur(8px) saturate(120%)'
                                  }}
                                >
                                  Not generated
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <span 
                                className="text-xs px-3 py-1.5"
                                style={{
                                  ...(hasActiveOrder ? statusBadgeStyles.preparing : statusBadgeStyles.served)
                                }}
                              >
                                {hasActiveOrder ? 'Occupied' : 'Available'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {hasActiveOrder ? (
                                <button
                                  onClick={() => setOrderingTableId(t.id || t._id)}
                                  className="p-2 transition-all duration-200 border"
                                  style={{
                                    backdropFilter: 'blur(20px) saturate(150%)',
                                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                    background: 'rgba(245, 158, 11, 0.25)', // Glassmorphism background
                                    color: '#92400e',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(245, 158, 11, 0.35)';
                                    e.target.style.border = '1px solid rgba(245, 158, 11, 0.5)';
                                    e.target.style.transform = 'scale(1.02)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(245, 158, 11, 0.25)'; // Match base
                                    e.target.style.border = '1px solid rgba(245, 158, 11, 0.4)'; // Match base
                                    e.target.style.transform = 'scale(1)';
                                  }}
                                  title="View / Edit Order"
                                >
                                  <PenIcon size={16} color="#92400e" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setOrderingTableId(t.id || t._id)}
                                  className="p-2 transition-all duration-200 border"
                                  style={{
                                    backdropFilter: 'blur(20px) saturate(150%)',
                                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                    background: 'rgba(34, 197, 94, 0.25)', // Glassmorphism background
                                    color: '#14532d',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(34, 197, 94, 0.35)';
                                    e.target.style.border = '1px solid rgba(34, 197, 94, 0.5)';
                                    e.target.style.transform = 'scale(1.02)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(34, 197, 94, 0.25)'; // Match base
                                    e.target.style.border = '1px solid rgba(34, 197, 94, 0.4)'; // Match base
                                    e.target.style.transform = 'scale(1)';
                                  }}
                                  title="Take Order"
                                >
                                  <UserPlusIcon 
                                    size={16}
                                    color="#14532d"
                                    strokeWidth={2}
                                  />
                                </button>
                              )}

                              <div 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete Table ${t.name}? This action cannot be undone.`)) {
                                    deleteTable(t.id || t._id);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200"
                                style={{
                                  ...deleteButtonStyles.base,
                                  outline: 'none' // Remove default focus outline
                                }}
                                onFocus={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                                  e.target.style.border = '2px solid rgba(239, 68, 68, 0.6)';
                                  e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                                }}
                                title="Delete Table"
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.5)';
                                  e.target.style.color = '#b91c1c';
                                  e.target.style.transform = 'scale(1.02)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                                  e.target.style.color = '#dc2626';
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                                }}
                              >
                                <TrashIcon 
                                  size={16}
                                  color="#dc2626"
                                  strokeWidth={2}
                                  dangerHover={true}
                                  shakeOnClick={true}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Section>
      )}

      {tab==='sales' && (
        <Section title="Sales Dashboard">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div 
              className="rounded-lg p-4 border-l-4"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderLeft: '4px solid rgba(34, 197, 94, 0.5)',
                borderRadius: '16px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <div className="text-sm text-gray-600 mb-1" style={{ color: '#3E2723', fontWeight: '500' }}>Total Sales</div>
              <div className="text-2xl font-bold" style={{ color: '#16a34a', fontWeight: '600' }}>₹{salesTotal.toFixed(2)}</div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
                {receipts.filter(r => r.status === 'closed').length} orders
              </div>
            </div>
            
            <div 
              className="rounded-lg p-4 border-l-4"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderLeft: '4px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '16px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <div className="text-sm text-gray-600 mb-1" style={{ color: '#3E2723', fontWeight: '500' }}>Average Order Value</div>
              <div className="text-2xl font-bold" style={{ color: '#2563eb', fontWeight: '600' }}>
                ₹{receipts.length > 0 ? (salesTotal / receipts.filter(r => r.status === 'closed').length).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>Per order average</div>
            </div>
            
            <div 
              className="rounded-lg p-4 border-l-4"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderLeft: '4px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '16px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <div className="text-sm text-gray-600 mb-1" style={{ color: '#3E2723', fontWeight: '500' }}>Total Items Sold</div>
              <div className="text-2xl font-bold" style={{ color: '#9333ea', fontWeight: '600' }}>
                {receipts.reduce((sum, r) => sum + (r.items?.reduce((itemSum, item) => itemSum + (item.qty || 0), 0) || 0), 0)}
              </div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>All menu items</div>
            </div>
            
            <div 
              className="rounded-lg p-4 border-l-4"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderLeft: '4px solid rgba(251, 146, 60, 0.5)',
                borderRadius: '16px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <div className="text-sm text-gray-600 mb-1" style={{ color: '#3E2723', fontWeight: '500' }}>Active Orders</div>
              <div className="text-2xl font-bold" style={{ color: '#ea580c', fontWeight: '600' }}>
                {receipts.filter(r => r.status === 'open').length}
              </div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>Currently being prepared</div>
            </div>
          </div>

          {/* Sales Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Selling Items */}
            <div 
              className="rounded-lg p-4"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3E2723', fontWeight: '500' }}>Top Selling Items</h3>
              <div className="space-y-2">
                {(() => {
                  const itemSales = {};
                  receipts.forEach(receipt => {
                    if (receipt.items) {
                      receipt.items.forEach(item => {
                        const itemName = item.name || 'Unknown Item';
                        if (!itemSales[itemName]) {
                          itemSales[itemName] = { name: itemName, quantity: 0, revenue: 0 };
                        }
                        itemSales[itemName].quantity += item.qty || 0;
                        itemSales[itemName].revenue += (item.price || 0) * (item.qty || 0);
                      });
                    }
                  });
                  
                  const topItems = Object.values(itemSales)
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5);
                  
                  return topItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded transition-all duration-200" style={{
                      backgroundColor: 'transparent',
                      borderRadius: '8px'
                    }} onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(212, 167, 106, 0.1)';
                    }} onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                    }}>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: '#3E2723' }}>{item.name}</div>
                        <div className="text-sm" style={{ color: '#6b7280' }}>{item.quantity} sold</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: '#16a34a' }}>₹{item.revenue.toFixed(2)}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Recent Orders */}
            <div 
              className="rounded-lg p-4"
              style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '16px',
                border: '1px solid rgba(212, 167, 106, 0.2)',
                boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3E2723', fontWeight: '500' }}>Recent Orders</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {receipts
                  .filter(r => r.status === 'closed')
                  .sort((a, b) => new Date(b.createdAt || b.orderTime) - new Date(a.createdAt || b.orderTime))
                  .slice(0, 5)
                  .map((receipt, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded transition-all duration-200 border-b" style={{
                      backgroundColor: 'transparent',
                      borderRadius: '8px',
                      borderBottomColor: 'rgba(212, 167, 106, 0.1)'
                    }} onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(212, 167, 106, 0.1)';
                    }} onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                    }}>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: '#3E2723' }}>
                          Table {receipt.tableId || 'Unknown'}
                        </div>
                        <div className="text-sm" style={{ color: '#6b7280' }}>
                          {new Date(receipt.createdAt || receipt.orderTime).toLocaleDateString()} • 
                          {receipt.items?.length || 0} items
                        </div>
                        {receipt.couponCode && (
                          <div className="text-xs" style={{ color: '#16a34a' }}>Coupon: {receipt.couponCode}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: '#16a34a' }}>₹{receipt.total?.toFixed(2) || '0.00'}</div>
                        {receipt.discount > 0 && (
                          <div className="text-xs" style={{ color: '#dc2626' }}>-₹{receipt.discount.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div 
            className="rounded-lg p-4"
            style={{
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '16px',
              border: '1px solid rgba(212, 167, 106, 0.2)',
              boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#3E2723', fontWeight: '500' }}>Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => generateSalesPDF()}
                className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(34, 197, 94, 0.25)',
                  color: '#14532d',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.35)';
                  e.target.style.border = '1px solid rgba(34, 197, 94, 0.5)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(34, 197, 94, 0.25)';
                  e.target.style.border = '1px solid rgba(34, 197, 94, 0.4)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Sales Report
              </button>
              
              <button
                onClick={() => setTab('receipts')}
                className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(59, 130, 246, 0.25)',
                  color: '#1e3a8a',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.35)';
                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.25)';
                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View All Receipts
              </button>
              
              <button
                onClick={() => setTab('menu')}
                className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(168, 85, 247, 0.25)',
                  color: '#6b21a8',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(168, 85, 247, 0.35)';
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.5)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(168, 85, 247, 0.25)';
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.4)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Manage Menu
              </button>
            </div>
          </div>
        </Section>
      )}

      {tab === 'users' && (
        <Section title="Users">
          <div className="mb-6 flex items-center gap-3">
            <button 
              onClick={addWaiter}
              className="view-button flex-shrink-0"
              style={{
                ...animatedButtonStyles.viewButton,
                minWidth: '130px',
                padding: '12px 16px',
                fontSize: '14px',
                height: '44px'
              }}
            >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '14px', height: '14px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)', color: '#3E2723' }}>Add Waiter</span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '14px', height: '14px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
            </button>
            
            <button 
              onClick={addChef}
              className="view-button flex-shrink-0"
              style={{
                ...animatedButtonStyles.viewButton,
                minWidth: '120px',
                padding: '12px 16px',
                fontSize: '14px',
                height: '44px'
              }}
            >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '14px', height: '14px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)', color: '#3E2723' }}>Add Chef</span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.32, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '14px', height: '14px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
            </button>

            {user?.username?.toLowerCase() === 'abg' && (
              <button 
                onClick={() => {
                  const username = prompt('Admin username');
                  const password = prompt('Admin password');
                  if (!username || !password) return;
                  
                  fetch(`${API_URL}/api/users`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username, password, role: 'admin' })
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.error) throw new Error(data.error);
                    loadAllData();
                    toast.success('Admin added successfully');
                  })
                  .catch(err => {
                    console.error('Error adding admin:', err);
                    toast.error(err.message || 'Failed to add admin');
                  });
                }}
                className="animated-button group relative inline-flex items-center justify-center"
                style={{
                  '--color': '#D4A76A',
                  '--hover-color': '#3E2723',
                  padding: '8px 24px',
                  fontSize: '14px',
                  minWidth: '140px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '2px solid',
                  borderColor: 'transparent',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  borderRadius: '100px',
                  color: '#D4A76A',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                  boxShadow: '0 0 0 2px #D4A76A'
                }}
              >
                <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  Add Admin
                </span>
                <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <style>{`
                  .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                  .animated-button:hover .arr-1 { right: -25% !important; }
                  .animated-button:hover .arr-2 { left: 16px !important; }
                  .animated-button:hover .text { transform: translateX(12px) !important; }
                  .animated-button:hover svg { fill: white !important; }
                  .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                  .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
                `}</style>
              </button>
            )}
          </div>

          {/* Users List */}
          <div className="overflow-hidden">
            {isLoadingUsers ? (
              <div 
                className="p-12 text-center"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 167, 106, 0.2)',
                  boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                }}
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div 
                className="p-12 text-center"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 167, 106, 0.2)',
                  boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                }}
              >
                <div className="text-gray-500 text-lg">No users found. Add your first user to get started.</div>
              </div>
            ) : (
              <div 
                className="divide-y w-full"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '20px',
                  border: '1px solid rgba(212, 167, 106, 0.2)',
                  boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                  padding: '20px',
                  divideColor: 'rgba(212, 167, 106, 0.2)'
                }}
              >
                {users
                  .filter(u => !(u.hidden && user?.username !== 'AbG'))
                  .map((u, index) => {
                    const canDelete = (user?.username === 'AbG' && u.id !== 'root') || 
                                    (user?.role === 'admin' && (u.role === 'waiter' || u.role === 'chef'));
                    
                    // Role-based styling with original colors but pill-shaped tags
                    const roleStyles = {
                      admin: 'bg-purple-100 text-purple-800',
                      chef: 'bg-blue-100 text-blue-800',
                      waiter: 'bg-green-100 text-green-800',
                      default: 'bg-gray-100 text-gray-800'
                    };
                    
                    const roleStyle = roleStyles[u.role] || roleStyles.default;
                    
                    return (
                      <div 
                        key={u.id || u._id} 
                        className="p-4 group"
                        style={{
                          borderBottomColor: 'rgba(212, 167, 106, 0.2)',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                              {u.role === 'admin' ? (
                                // Shield icon for admin
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : u.role === 'chef' ? (
                                // Detailed chef hat icon
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
                                </svg>
                              ) : (
                                // Serving tray icon for waiters
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h6l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{u.username}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span 
                                  className="text-xs px-3 py-1.5"
                                  style={{
                                    ...(u.role === 'admin' ? statusBadgeStyles.preparing : 
                                     u.role === 'chef' ? statusBadgeStyles.ready : 
                                     statusBadgeStyles.served)
                                  }}
                                >
                                  {u.role}
                                </span>
                                <span className="text-xs text-gray-500">ID: {u.id || u._id}</span>
                              </div>
                            </div>
                          </div>
                          
                          {canDelete && (
                            <div className="mt-3 sm:mt-0 flex space-x-2">
                              <div 
                                onClick={() => resetUserPassword(u.id || u._id, u.username)}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer"
                                style={{
                                  backdropFilter: 'blur(20px) saturate(150%)',
                                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                                  background: 'rgba(59, 130, 246, 0.25)', // Blue glassmorphism
                                  borderRadius: '50%',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  color: '#2563eb',
                                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onFocus={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.35)';
                                  e.target.style.border = '2px solid rgba(59, 130, 246, 0.6)';
                                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.25)'; // Match base
                                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; // Match base
                                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                                }}
                                title="Reset Password"
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.35)';
                                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)';
                                  e.target.style.color = '#1d4ed8';
                                  e.target.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(59, 130, 246, 0.25)'; // Match base
                                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; // Match base
                                  e.target.style.color = '#2563eb';
                                  e.target.style.transform = 'scale(1)';
                                }}
                              >
                                <FiKey 
                                  size={16}
                                  color="#2563eb"
                                  strokeWidth={2}
                                />
                              </div>
                              <div 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${u.username}? This action cannot be undone.`)) {
                                    deleteUser(u.id || u._id);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer"
                                style={{
                                  ...deleteButtonStyles.base,
                                  outline: 'none' // Remove default focus outline
                                }}
                                title="Delete User"
                              >
                                <TrashIcon 
                                  size={16}
                                  color="#dc2626"
                                  strokeWidth={2}
                                  dangerHover={true}
                                  shakeOnClick={true}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </Section>
      )}

      {tab==='service' && (
        <Section title="Service (Take Orders)">
          <WaiterDashboard embedded onExit={()=>{}} />
        </Section>
      )}

      {tab==='settings' && (
        <SettingsPanel onBack={() => setTab('menu')} />
      )}

      <>
        {/* QR Code Modal */}
        {qrModal.open && qrModal.table && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Table QR Code</h3>
                <button
                  onClick={() => setQrModal({ open: false, table: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <QRCodeDisplay 
                url={qrModal.table.qrCode}
                tableName={qrModal.table.name}
                tableCode={qrModal.table.tableCode}
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setQrModal({ open: false, table: null })}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          open={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, receipt: null })}
          receipt={paymentModal.receipt}
          onPaymentComplete={handlePaymentComplete}
          tableMap={tableMap}
          onExit={() => setTab('menu')}
        />
      </>
    </div>
  )
}